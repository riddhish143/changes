import React, { useState } from 'react';
import { Stack, Grid, Column, TextArea, Tile } from '@carbon/react';
import IssueFilter from './IssueFilter';
import IssueTable from './IssueTable';
import ChangelogGenerator from './ChangelogGenerator';
import useIssueData from '../hooks/useIssueData.jsx';
import useChangelogGenerator from '../hooks/useChangelogGenerator.jsx';
import SectionTiles from './SectionTiles';
/**
 * Main IssueList component that orchestrates the issue list and changelog generation
 */
const IssueList = ({ 
  issues, 
  repoOwner, 
  repoName, 
  selectedMilestone,
  selectedBranch,
  milestones,
  onChangelogGenerated,
  changelogError,
  setChangelogError
}) => {
  const [issueFilter, setIssueFilter] = useState('');
  const [importantText, setImportantText] = useState('');
  const [announcementText, setAnnouncementText] = useState('');

  // Use custom hooks for managing issue data and changelog generation
  const {
    editedReleaseNotes,
    savingIssues,
    expandedRows,
    headers,
    transformIssues,
    handleReleaseNoteChange,
    toggleAllRows,
    toggleRow,
    handleKeyDown,
    selectedIssues,
    toggleIssueSelection,
    toggleAllIssueSelection
  } = useIssueData(issues);

  const {
    isGenerating,
    changelogContent,
    changelogSuccess,
    showMarkdownPopup,
    setShowMarkdownPopup,
    generateChangelog,
    handleSaveChangelog
  } = useChangelogGenerator(
    issues, 
    editedReleaseNotes, 
    repoOwner, 
    repoName, 
    selectedMilestone, 
    selectedBranch, 
    milestones, 
    onChangelogGenerated, 
    setChangelogError,
    importantText,
    announcementText,
    selectedIssues
  );

  // Transform issues into rows format expected by DataTable
  const allRows = transformIssues();

  // Filter rows based on search input
  const filteredRows = allRows.filter(row => 
    row.title.toLowerCase().includes(issueFilter.toLowerCase()) ||
    row.number.toString().includes(issueFilter)
  );

  return (
    <Stack spacing={2}>
      {/* Issue Filter Component */}
      <IssueFilter 
        issueFilter={issueFilter}
        setIssueFilter={setIssueFilter}
        allRows={allRows}
        filteredRows={filteredRows}
        handleKeyDown={handleKeyDown}
      />

      {/* Important and Announcement Sections */}
      <div style={{ marginBottom: '0.1rem' }}>
        <SectionTiles
          importantText={importantText}
          setImportantText={setImportantText}
          announcementText={announcementText}
          setAnnouncementText={setAnnouncementText}
        />
      </div>

      {/* Issue Table Component */}
      <IssueTable 
        rows={filteredRows}
        headers={headers}
        expandedRows={expandedRows}
        toggleRow={toggleRow}
        toggleAllRows={() => toggleAllRows(filteredRows)}
        editedReleaseNotes={editedReleaseNotes}
        handleReleaseNoteChange={handleReleaseNoteChange}
        repoOwner={repoOwner}
        repoName={repoName}
        selectedMilestone={selectedMilestone}
        milestones={milestones}
        filteredRows={filteredRows}
        selectedIssues={selectedIssues}
        toggleIssueSelection={toggleIssueSelection}
        toggleAllIssueSelection={toggleAllIssueSelection}
      />

      {/* Changelog Generator Component */}
      <ChangelogGenerator 
        isGenerating={isGenerating}
        changelogError={changelogError}
        changelogSuccess={changelogSuccess}
        generateChangelog={generateChangelog}
        editedReleaseNotes={editedReleaseNotes}
        showMarkdownPopup={showMarkdownPopup}
        setShowMarkdownPopup={setShowMarkdownPopup}
        changelogContent={changelogContent}
        handleSaveChangelog={handleSaveChangelog}
        repoOwner={repoOwner}
        repoName={repoName}
        selectedBranch={selectedBranch}
        selectedMilestone={selectedMilestone}
        milestones={milestones}
        importantText={importantText}
        announcementText={announcementText}
        selectedIssues={selectedIssues}
      />
    </Stack>
  );
};

export default IssueList;
