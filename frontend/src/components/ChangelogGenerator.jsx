import React from 'react';
import { Button } from '@carbon/react';
import MarkdownPopup from './MarkdownPopup';

/**
 * ChangelogGenerator component for generating and managing changelogs
 */
const ChangelogGenerator = ({
  isGenerating,
  changelogError,
  changelogSuccess,
  generateChangelog,
  editedReleaseNotes,
  showMarkdownPopup,
  setShowMarkdownPopup,
  changelogContent,
  handleSaveChangelog,
  repoOwner,
  repoName,
  selectedBranch,
  selectedMilestone,
  milestones,
  importantText,
  announcementText,
  selectedIssues
}) => {
  // Count the number of selected issues
  const selectedCount = Object.values(selectedIssues).filter(Boolean).length;
  const totalCount = Object.keys(selectedIssues).length;
  
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <div className="toggle-button-wrapper">
          <Button
            kind={changelogError ? "danger" : "primary"}
            onClick={generateChangelog}
            className="generate-button"
            disabled={isGenerating || selectedCount === 0}
          >
            {isGenerating ? (
              <span className="loading-indicator"><span className="dot" /><span className="dot" /><span className="dot" /></span>
            ) : (
              <>{changelogError ? 'Generate CHANGES.md ↻' : `Generate CHANGES.md (${selectedCount}/${totalCount} issues)`}</>
            )}
          </Button>
        </div>
      </div>

      {showMarkdownPopup && (
        <MarkdownPopup
          content={changelogContent}
          onClose={() => setShowMarkdownPopup(false)}
          onSave={handleSaveChangelog}
          isLoading={isGenerating}
          repoOwner={repoOwner}
          repoName={repoName}
          selectedBranch={selectedBranch}
          selectedMilestone={selectedMilestone}
          milestones={milestones}
          importantText={importantText}
          announcementText={announcementText}
          popupType="markdown"
        />
      )}
    </>
  );
};

export default ChangelogGenerator; 