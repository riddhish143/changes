import React, { useState, useEffect } from 'react';
import MarkdownEditor from './MarkdownEditor';
import { Button } from '@carbon/react';
import '../styles/MarkdownPopup.css';
import { fetchContent, updateVersion, createPullRequest, createGistLink } from '../utils/apiService';
import { useToast } from '@chakra-ui/react';

const MarkdownPopup = ({ 
  content, 
  onClose, 
  onSave, 
  isLoading: propIsLoading, 
  repoOwner, 
  repoName, 
  selectedBranch, 
  isSharedView = false,
  popupType = null,
  selectedMilestone,
  milestones,
  importantText,
  announcementText
}) => {
  const [isEditing, setIsEditing] = useState(isSharedView);
  const [isApproved, setIsApproved] = useState(false);
  const [editedContent, setEditedContent] = useState(content || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(propIsLoading);
  const toast = useToast();

  useEffect(() => {
    setIsLoading(propIsLoading);
  }, [propIsLoading]);

  useEffect(() => {
    if (content !== editedContent) {
      setEditedContent(content || '');
    }
  }, [content]);

  useEffect(() => {
    // Store current scroll position
    const scrollY = window.scrollY;
    
    // Disable scrolling on the main body
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    // Cleanup function to restore scrolling
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleCloseClick = () => {
    // If there are unsaved changes, show confirmation
    if (isEditing && hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsApproved(false);
    setHasChanges(false);
  };

  const handleApprove = () => {
    setIsEditing(false);
    setIsApproved(true);
  };

  const handleSubmit = async () => {
    if (isApproved && !isLoading) {
      try {
        setIsLoading(true);
        
        // Get the milestone title if available
        const milestoneTitle = selectedMilestone ? 
          milestones?.find(m => m.id.toString() === selectedMilestone)?.title : '';
        
        // Ensure content is properly formatted
        const formattedContent = editedContent.trim();
        
        // Create PR title and body
        const prTitle = `Update CHANGES.md${milestoneTitle ? ` and version to ${milestoneTitle}` : ''}`;
        const prBody = `This PR updates the CHANGES.md file${milestoneTitle ? ` and bumps the version to ${milestoneTitle}` : ''}.`;
        
        // Create a pull request with both changes
        const result = await createPullRequest(
          repoOwner,
          repoName,
          selectedBranch,
          formattedContent,
          milestoneTitle || '',
          prTitle,
          prBody,
          milestoneTitle || 'no-milestone' // Pass milestone title as the milestone parameter
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
        
        // If in shared view, don't automatically close the popup
        if (isSharedView) {
          // Add a button to return to the main app
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
                  onClick={() => onClose()}
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
          
          // Reset the state but don't close the popup
          setIsApproved(false);
          setIsEditing(false);
        } else {
          // Close the popup after successful PR creation for non-shared view
          onClose();
        }
      } catch (error) {
        console.error('Error during submission:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to create pull request',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'bottom-right'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleContentChange = (newContent) => {
    if (isEditing) {
      setEditedContent(newContent);
      setHasChanges(true);
    }
  };

  const handleCancel = () => {
    if (isEditing && hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setIsEditing(false);
        setEditedContent(content);
        setHasChanges(false);
      }
    } else {
      setIsEditing(false);
      setEditedContent(content);
      setHasChanges(false);
    }
  };

  const handleFetchChanges = async () => {
    // Check if repository information is available
    if (!repoOwner || !repoName || !selectedBranch) {
      toast({
        title: 'Missing Repository Information',
        description: 'Unable to fetch changes: Missing repository information. Please ensure repository owner, name, and branch are provided.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'bottom-right'
      });
      return;
    }
    
    try {
      setIsFetching(true);
      const response = await fetchContent(repoOwner, repoName, selectedBranch, true);
      setEditedContent(response.content);
      toast({
        title: 'Success',
        description: 'Successfully fetched changes from backup.md',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'bottom-right'
      });
    } catch (error) {
      console.error('Error fetching changes:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch changes',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'bottom-right'
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Function to handle direct save to GitHub
  const handleSaveToGithub = () => {
    // Check if repository information is available
    if (!repoOwner || !repoName || !selectedBranch) {
      toast({
        title: 'Missing Repository Information',
        description: 'Unable to save to GitHub: Missing repository information. Please ensure repository owner, name, and branch are provided.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'bottom-right'
      });
      return;
    }
    
    // If we have repository information, proceed with saving
    onSave(editedContent, "Auto-backup of changes", true);
  };

  // Function to generate and copy shareable link
  const handleShareableLink = async () => {
    if (!editedContent.trim()) {
      toast({
        title: 'Error',
        description: 'Cannot create shareable link for empty content',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'bottom-right'
      });
      return;
    }

    try {
      setIsFetching(true);
      // Create a GitHub Gist with the current content
      const result = await createGistLink(editedContent);
      
      if (result && result.gist_url) {
        // Create a shareable URL for the current app with the gist URL as a parameter
        // For HashRouter, we need to use # in the URL
        const baseUrl = `${window.location.origin}${window.location.pathname}#`;
        
        // Include repository information in the URL if available
        let shareableLink = `${baseUrl}/?openEditor=true&gistUrl=${encodeURIComponent(result.gist_url)}&popup=markdown`;
        
        if (repoOwner && repoName && selectedBranch) {
          shareableLink += `&repoOwner=${encodeURIComponent(repoOwner)}&repoName=${encodeURIComponent(repoName)}&branch=${encodeURIComponent(selectedBranch)}`;
          
          // Add version/milestone if available
          if (selectedMilestone && milestones) {
            const milestoneTitle = milestones.find(m => m.id.toString() === selectedMilestone)?.title;
            if (milestoneTitle) {
              shareableLink += `&version=${encodeURIComponent(milestoneTitle)}`;
            }
          }
        }
        
        // Copy the shareable link to clipboard
        navigator.clipboard.writeText(shareableLink).then(() => {
          toast({
            title: 'Link Copied!',
            description: 'Shareable link has been copied to clipboard. When opened, it will display the markdown editor with your content.',
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'bottom-right'
          });
        });
      } else {
        throw new Error('Failed to get Gist URL from server response');
      }
    } catch (error) {
      console.error('Error creating shareable link:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate or copy shareable link',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'bottom-right'
      });
    } finally {
      setIsFetching(false);
    }
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  // Helper function to determine the title
  const getPopupTitle = () => {
    return 'CHANGES.md';
  };

  return (
    <div className="markdown-popup" onWheel={stopPropagation} onTouchMove={stopPropagation}>
      <div className="markdown-popup-content" onClick={stopPropagation}>
        <div className="markdown-popup-header">
          <h2>{getPopupTitle()}</h2>
          <div className="markdown-popup-actions">
            {!isEditing && !isApproved && (
              <>
                <Button 
                  kind="secondary" 
                  size="sm"
                  onClick={handleEdit}
                  disabled={isLoading || isFetching}
                >
                  Edit
                </Button>
                {/* Show Fetch New Changes button if we have repository information */}
                {repoOwner && repoName && selectedBranch && (
                  <Button
                    kind="secondary"
                    size="sm"
                    onClick={handleFetchChanges}
                    disabled={isLoading || isFetching}
                  >
                    {isFetching ? 'Fetching...' : 'Fetch New Changes'}
                  </Button>
                )}
                
                {/* Always show Get Shareable Link button if we have content */}
                <Button
                  kind="secondary"
                  size="sm"
                  onClick={handleShareableLink}
                  disabled={isLoading || isFetching || !editedContent.trim()}
                >
                  Get Shareable Link
                </Button>
                
                {/* Show Return to Main App button in shared view */}
                {isSharedView && (
                  <Button
                    kind="secondary"
                    size="sm"
                    onClick={onClose}
                    disabled={isLoading || isFetching}
                  >
                    Return to Main App
                  </Button>
                )}
              </>
            )}
            {isEditing && (
              <>
                <Button 
                  kind="secondary" 
                  size="sm"
                  onClick={handleCancel}
                  disabled={isLoading || isFetching}
                >
                  Cancel
                </Button>
                <Button 
                  kind="primary" 
                  size="sm"
                  onClick={handleApprove}
                  disabled={isLoading || isFetching}
                >
                  Approve
                </Button>
                <Button 
                  kind="tertiary" 
                  size="sm"
                  onClick={handleSaveToGithub}
                  disabled={isLoading || isFetching}
                >
                  Save to GitHub
                </Button>
                
                {/* Show Return to Main App button in shared view */}
                {isSharedView && (
                  <Button
                    kind="secondary"
                    size="sm"
                    onClick={onClose}
                    disabled={isLoading || isFetching}
                  >
                    Return to Main App
                  </Button>
                )}
              </>
            )}
            {isApproved && (
              <>
                <Button 
                  kind="primary" 
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isLoading || isFetching}
                >
                  {isLoading ? 'Creating PR...' : 'Create Pull Request'}
                </Button>
                
                {/* Show Return to Main App button in shared view */}
                {isSharedView && (
                  <Button
                    kind="secondary"
                    size="sm"
                    onClick={onClose}
                    disabled={isLoading || isFetching}
                  >
                    Return to Main App
                  </Button>
                )}
              </>
            )}
            <Button 
              kind="danger" 
              size="sm"
              onClick={handleCloseClick}
              disabled={isLoading || isFetching}
            >
              Close
            </Button>
          </div>
        </div>
        <div className="markdown-popup-editor">
          <div className="markdown-editor-container" data-color-mode="light">
            <MarkdownEditor
              initialValue={editedContent}
              onChange={handleContentChange}
              readOnly={!isEditing || isLoading || isFetching}
            />
          </div>
        </div>
        <div className="markdown-popup-status">
          <div className="status-text">
            {(isLoading || isFetching) && (isLoading ? 'Saving changes...' : 'Fetching changes...')}
            {!isLoading && !isFetching && (
              <>
                {isEditing && 'Editing CHANGES.md - Make your changes and click Approve'}
                {isApproved && 'Changes approved - Click Create Pull Request to submit for review'}
                {!isEditing && !isApproved && 'View mode - Click Edit to make changes'}
              </>
            )}
          </div>
          {isEditing && hasChanges && (
            <div className="status-indicator">
              Changes pending approval
            </div>
          )}
          {repoOwner && repoName && selectedBranch && (
            <div className="repo-info">
              Repository: {repoOwner}/{repoName} (Branch: {selectedBranch})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkdownPopup; 