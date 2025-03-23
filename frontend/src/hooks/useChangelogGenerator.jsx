import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { processReleaseNotes, extractNoteCategories, groupNotesByType, generateChangelogContent } from '../utils/changelogUtils';
import { pushContent, fetchContent } from '../utils/apiService';

/**
 * Custom hook for managing changelog generation
 **/
const useChangelogGenerator = (issues, editedReleaseNotes, repoOwner, repoName, selectedMilestone, selectedBranch, milestones, onChangelogGenerated, setChangelogError, importantText = '', announcementText = '', selectedIssues = {}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [changelogContent, setChangelogContent] = useState('');
  const [changelogSuccess, setChangelogSuccess] = useState(false);
  const [showMarkdownPopup, setShowMarkdownPopup] = useState(false);
  const toast = useToast();

  const generateChangelog = async () => {
    setIsGenerating(true);
    setChangelogError(false);
    setChangelogSuccess(false);

    try {
      // Validate input data
      if (!Array.isArray(issues) || issues.length === 0) {
        throw new Error('No issues available to generate changelog');
      }

      if (!selectedMilestone) {
        throw new Error('No milestone selected');
      }

      const milestone = milestones?.find(m => m.id.toString() === selectedMilestone);
      if (!milestone) {
        throw new Error('Selected milestone not found');
      }

      // const response = await fetch(`http://127.0.0.1:5000/api/fetch-version-content`);
      // const data = await response.json();
      // if (!data.content) {
      //   throw new Error('Milestone content not found in API response');
      // }
      // const milestoneName = data.content;

      const milestoneName = milestone.title;
      const currentDate = new Date().toISOString().split('T')[0];

      // Filter out unselected issues
      const filteredEditedReleaseNotes = {};
      const filteredIssues = issues.filter(issue => {
        const isSelected = selectedIssues[issue.number] === true;
        if (isSelected) {
          filteredEditedReleaseNotes[issue.number] = editedReleaseNotes[issue.number];
        }
        return isSelected;
      });

      if (filteredIssues.length === 0) {
        throw new Error('No issues selected for changelog generation');
      }

      // Process release notes with filtered issues
      const { allNotes, notesWithErrors } = processReleaseNotes(filteredEditedReleaseNotes, filteredIssues);

      // Extract and validate categories
      const { processedNotes, invalidNotes } = extractNoteCategories(allNotes);

      // Group notes by type, component, and category
      const groupedByType = groupNotesByType(processedNotes);

      // Generate content
      const content = generateChangelogContent(groupedByType, milestoneName, currentDate, importantText, announcementText);

      // Set states and show success message
      setChangelogContent(content);
      onChangelogGenerated(true);
      setChangelogSuccess(true);
      setShowMarkdownPopup(true);

    } catch (error) {
      console.error('Error generating changelog:', error);
      setChangelogError(true);
      setChangelogSuccess(false);
      onChangelogGenerated(false);
      
      // Provide detailed error feedback
      toast({
        title: 'Error generating changelog',
        description: error.message || 'Failed to generate changelog',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'bottom-right'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearChangelog = () => {
    setChangelogContent('');
    onChangelogGenerated(false);
    setChangelogSuccess(false);
    setChangelogError(false);
  };

  const handleSaveChangelog = async (content, providedCommitMessage = null, isBackup = false) => {
    setIsGenerating(true);
    try {
      // Use provided commit message or prompt for one
      let commitMessage = providedCommitMessage;
      
      if (!isBackup && commitMessage === null) {
        // Prompt for commit message only if not provided and not a backup
        commitMessage = window.prompt('Please enter your commit message:', 'Update CHANGES.md');
        
        // If user cancels the prompt, abort the save
        if (commitMessage === null) {
          setIsGenerating(false);
          return;
        }
      }

      // If it's not a backup save, fetch existing content and append at the top
      if (!isBackup) {
        try {
          // Fetch existing content
          const existingContent = await fetchContent(repoOwner, repoName, selectedBranch, false);
          
          // Add new content at the top with a separator
          const separator = '\n\n---\n\n';
          const updatedContent = content + separator + existingContent.content;

          // Save the combined content
          await pushContent(
            repoOwner,
            repoName,
            selectedBranch,
            updatedContent,
            commitMessage || 'Update CHANGES.md',
            isBackup
          );
        } catch (fetchError) {
          // If file doesn't exist yet, just save the new content
          if (fetchError.message.includes('not found')) {
            await pushContent(
              repoOwner,
              repoName,
              selectedBranch,
              content,
              commitMessage || 'Create CHANGES.md',
              isBackup
            );
          } else {
            throw fetchError;
          }
        }
      } else {
        // For backup saves, just save the content as is
        await pushContent(
          repoOwner,
          repoName,
          selectedBranch,
          content,
          commitMessage || 'Auto-backup of changes',
          isBackup
        );
      }

      toast({
        title: 'Success',
        description: isBackup ? 'Successfully saved backup.md' : 'Successfully appended to CHANGES.md',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'bottom-right'
      });

      // Only close the markdown popup for regular saves, not backups
      if (!isBackup) {
        setShowMarkdownPopup(false);
      }
      
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: 'Error saving file',
        description: error.message || 'Failed to save file',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'bottom-right'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    changelogContent,
    changelogSuccess,
    showMarkdownPopup,
    setShowMarkdownPopup,
    generateChangelog,
    handleClearChangelog,
    handleSaveChangelog
  };
};

export default useChangelogGenerator; 