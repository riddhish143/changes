import React, { useState, useEffect } from 'react';
import MarkdownPopup from './MarkdownPopup';
import { useQueryParams } from '../hooks/useQueryParams';
import { pushContent, updateVersion, fetchContent, createPullRequest } from '../utils/apiService';
import { useToast, Spinner, Center, Box, Text, Button } from '@chakra-ui/react';

const SharedMarkdownView = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [sharedContent, setSharedContent] = useState('');
  const [repoInfo, setRepoInfo] = useState({
    repoOwner: '',
    repoName: '',
    selectedBranch: '',
    version: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Function to redirect to the main app
  const redirectToMainApp = () => {
    const baseUrl = window.location.origin;
    const redirectUrl = `${baseUrl}/#/?owner=${repoInfo.repoOwner}&repo=${repoInfo.repoName}&branch=${repoInfo.selectedBranch}&milestone=${repoInfo.version}&autoFetch=true`;
    window.location.href = redirectUrl;
  };

  const handleOpenEditor = (content, type, repoData = {}) => {
    setIsLoading(false);
    
    if (!content) {
      setError('No content was found. The shared link may be invalid or the Gist may have been deleted.');
      return;
    }
    
    setSharedContent(content);
    setRepoInfo({
      repoOwner: repoData.repoOwner || '',
      repoName: repoData.repoName || '',
      selectedBranch: repoData.branch || '',
      version: repoData.version || ''
    });
    setIsEditorOpen(true);
  };

  const handleClose = () => {
    setIsEditorOpen(false);
    setSharedContent('');
    setError(null);
    
    // Only redirect if shouldRedirect is true
    if (shouldRedirect) {
      redirectToMainApp();
    }
    
    // Reset the repo info
    setRepoInfo({
      repoOwner: '',
      repoName: '',
      selectedBranch: '',
      version: ''
    });
  };

  const handleSave = async (content, commitMessage = null, isBackup = false) => {
    setIsSaving(true);
    try {
      // Use repository information from repoInfo
      const owner = repoInfo.repoOwner;
      const repo = repoInfo.repoName;
      const branch = repoInfo.selectedBranch;
      const version = repoInfo.version;

      // Validate repository information
      if (!owner || !repo || !branch) {
        throw new Error('Missing repository information. Please ensure owner, name, and branch are provided.');
      }

      // If it's a backup save, use the regular pushContent function
      if (isBackup) {
        await pushContent(
          owner,
          repo,
          branch,
          content,
          commitMessage || 'Auto-backup of changes',
          isBackup
        );

        toast({
          title: 'Success',
          description: 'Successfully saved backup.md',
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'bottom-right'
        });
      } else {
        // For regular saves, create a pull request
        // Create PR title and body
        const prTitle = `Update CHANGES.md${version ? ` and version to ${version}` : ''}`;
        const prBody = `This PR updates the CHANGES.md file${version ? ` and bumps the version to ${version}` : ''}.`;
        
        // Ensure content is properly formatted
        const formattedContent = content.trim();
        
        // Create a pull request with both changes
        const result = await createPullRequest(
          owner,
          repo,
          branch,
          formattedContent,
          version || '',
          prTitle,
          prBody
        );
        
        
        // Show success toast
        toast({
          title: 'Success',
          description: `Pull request #${result.pull_request.number} created successfully. A reviewer will need to approve and merge it.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'bottom-right'
        });
        
        // Redirect to the PR URL
        if (result.pull_request && result.pull_request.html_url) {
          console.log(`Opening pull request URL: ${result.pull_request.html_url}`);
          
          // Use a small delay to ensure the browser doesn't block the popup
          setTimeout(() => {
            const newWindow = window.open(result.pull_request.html_url, '_blank');
            
            // If popup was blocked, show instructions to the user
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
              console.warn('Browser may have blocked the popup. Showing manual link instruction.');
              toast({
                title: 'Popup Blocked',
                description: `Your browser may have blocked the PR page. Click here to open PR #${result.pull_request.number}`,
                status: 'warning',
                duration: 10000,
                isClosable: true,
                position: 'bottom-right',
                onClick: () => window.open(result.pull_request.html_url, '_blank')
              });
            }
          }, 500);
        } else {
          console.error('No PR URL found in response:', result);
        }
        
        // Add a button to redirect to the main app
        toast({
          title: 'Return to Main App',
          description: 'Click here to return to the main application',
          status: 'info',
          duration: 10000,
          isClosable: true,
          position: 'bottom-right',
          render: () => (
            <div 
              style={{ 
                background: 'white', 
                padding: '12px', 
                borderRadius: '4px', 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>Return to Main App</div>
              <div>Your PR has been created successfully. You can now return to the main application.</div>
              <button 
                onClick={() => {
                  setShouldRedirect(true);
                  handleClose();
                }}
                style={{
                  background: '#0f62fe',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Return to Main App
              </button>
            </div>
          )
        });
        
        // Close the popup after successful PR creation, but don't redirect
        setIsEditorOpen(false);
        setSharedContent('');
      }
    } catch (error) {
      console.error('Error saving to GitHub:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create pull request',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'bottom-right'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Use the query params hook with error handling
  const handleQueryParamsError = (errorMessage) => {
    setIsLoading(false);
    setError(errorMessage);
  };

  useQueryParams(handleOpenEditor, handleQueryParamsError);

  useEffect(() => {
    // Check if we're still in loading state after a timeout
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError('Timeout while loading content. Please try again or check the shared link.');
      }
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  // If there's an error, show it
  if (error) {
    return (
      <Center h="100vh">
        <Box textAlign="center" p={8} maxW="md" borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Text fontSize="xl" fontWeight="bold" mb={4} color="red.500">Error Loading Content</Text>
          <Text mb={6}>{error}</Text>
          <Button colorScheme="blue" onClick={() => window.location.href = window.location.origin}>
            Return to Home
          </Button>
        </Box>
      </Center>
    );
  }

  // If still loading, show a spinner
  if (isLoading) {
    return (
      <Center h="100vh">
        <Box textAlign="center">
          <Spinner size="xl" mb={4} />
          <Text>Loading shared content...</Text>
        </Box>
      </Center>
    );
  }

  if (!isEditorOpen) {
    return null;
  }

  // Create a mock milestone object for the shared view
  const mockMilestones = repoInfo.version ? [
    { id: 'shared', title: repoInfo.version }
  ] : [];

  return (
    <MarkdownPopup
      content={sharedContent}
      onClose={handleClose}
      onSave={handleSave}
      isLoading={isSaving}
      isSharedView={true}
      popupType="markdown"
      repoOwner={repoInfo.repoOwner}
      repoName={repoInfo.repoName}
      selectedBranch={repoInfo.selectedBranch}
      selectedMilestone="shared"
      milestones={mockMilestones}
    />
  );
};

export default SharedMarkdownView;
