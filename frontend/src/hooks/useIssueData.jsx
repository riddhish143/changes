import { useState, useEffect } from 'react';
import { Link, Tag } from '@carbon/react';
import { extractReleaseNote, extractIssueAndPRLinks } from '../utils/releaseNoteUtils';
import { updateIssue } from '../utils/apiService';
import { findReleaseNoteSection } from '../utils/releaseNoteUtils';
import logger from '../utils/logger.js';

/**
 * Custom hook for managing issue data
 */
const useIssueData = (issues) => {
  const [editedReleaseNotes, setEditedReleaseNotes] = useState({});
  const [savingIssues, setSavingIssues] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedIssues, setSelectedIssues] = useState({});

  // Reset edited notes when issues change
  useEffect(() => {
    const newEditedNotes = {};
    const newSelectedIssues = {};
    issues.forEach(issue => {
      const releaseNote = extractReleaseNote(issue.body);
      newEditedNotes[issue.number] = releaseNote;
      newSelectedIssues[issue.number] = true; // Default all issues to selected
    });
    setEditedReleaseNotes(newEditedNotes);
    setSelectedIssues(newSelectedIssues);
    setSavingIssues({});
  }, [issues]);

  // Define headers for the table
  const headers = [
    {
      key: 'selected',
      header: 'Select',
    },
    {
      key: 'number',
      header: 'Issue No',
    },
    {
      key: 'title',
      header: 'Title',
    },
    {
      key: 'state',
      header: 'Status',
    },
    {
      key: 'closed_at',
      header: 'Closed At',
    },
    {
      key: 'issue_link',
      header: 'Issue Link',
    },
    {
      key: 'pr_link',
      header: 'PR Link',
    },
    {
      key: 'view',
      header: 'View',
    },
  ];

  // Transform issues into rows format expected by DataTable
  const transformIssues = () => {
    return issues.map((issue) => {
      const releaseNote = extractReleaseNote(issue.body);
      const { issueLink, prLinks } = extractIssueAndPRLinks(releaseNote);
      
      // Initialize the edited release note state for this issue
      if (!editedReleaseNotes[issue.number]) {
        setEditedReleaseNotes(prev => ({
          ...prev,
          [issue.number]: releaseNote
        }));
      }

      // Initialize selected state if not already set
      if (selectedIssues[issue.number] === undefined) {
        setSelectedIssues(prev => ({
          ...prev,
          [issue.number]: true // Default to selected
        }));
      }
      
      return {
        id: issue.number.toString(),
        selected: selectedIssues[issue.number] || false,
        number: issue.number,
        title: issue.title,
        state: (
          <Tag
            className="status-tag"
            size="sm"
            type={issue.state === 'open' ? 'green' : 'purple'}
            title={`Issue is ${issue.state}`}
          >
            {issue.state}
          </Tag>
        ),
        closed_at: issue.closed_at ? new Date(issue.closed_at).toLocaleDateString() : 'N/A',
        releaseNote: releaseNote,
        issue_link: issueLink ? (
          <Tag
            type="outline"
            size="sm"
            style={{ cursor: 'pointer' }}
            onClick={() => window.open(issueLink, '_blank', 'noopener noreferrer')}
          >
            Issue Link
          </Tag>
        ) : (
          <Tag type="outline" size="sm">N/A</Tag>
        ),
        pr_link: prLinks && prLinks.length > 0 ? (
          <div className="pr-link-container">
            {prLinks.map((link, index) => (
              <Tag className="pr-link-tag"
                key={index}
                type="outline"
                size="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => window.open(link, '_blank', 'noopener noreferrer')}
              >
                PR Link {prLinks.length > 1 ? index + 1 : ''}
              </Tag>
            ))}
          </div>
        ) : (
          <Tag type="outline" size="sm">N/A</Tag>
        ),
        view: (
          <Link href={issue.html_url} target="_blank" rel="noopener noreferrer">
            View on GitHub
          </Link>
        ),
      };
    });
  };

  // Toggle selection of a single issue
  const toggleIssueSelection = (issueNumber) => {
    setSelectedIssues(prev => ({
      ...prev,
      [issueNumber]: !prev[issueNumber]
    }));
  };

  // Toggle selection of all issues
  const toggleAllIssueSelection = (allSelected) => {
    const newSelectedIssues = {};
    issues.forEach(issue => {
      newSelectedIssues[issue.number] = !allSelected;
    });
    setSelectedIssues(newSelectedIssues);
  };

  const handleReleaseNoteChange = (issueNumber, value) => {
    setEditedReleaseNotes(prev => ({
      ...prev,
      [issueNumber]: value
    }));
    
    // Automatically save the release note after a short delay
    const debounceTimeout = setTimeout(async () => {
      try {
        // Find the original issue
        const issue = issues.find(i => i.number.toString() === issueNumber);
        if (!issue || !issue.body) {
          throw new Error('Issue not found or has no content');
        }

        // Find the release note section
        const section = findReleaseNoteSection(issue.body);
        
        let updatedBody;
        if (section) {
          // If release note section exists, replace only that section
          // Add a newline after the header and before the next section
          updatedBody = issue.body.slice(0, section.start) +
                      section.header + '\n' +
                      value +
                      (section.end < issue.body.length ? '\n\n' + issue.body.slice(section.end).trimLeft() : '');
        } else {
          // If no release note section exists, add it before the last section (if there's a --- at the end)
          const lastSectionMatch = issue.body.match(/\n---\s*$/);
          if (lastSectionMatch) {
            const insertPosition = lastSectionMatch.index;
            updatedBody = issue.body.slice(0, insertPosition) +
                        '\n## Release Note\n' +
                        value +
                        issue.body.slice(insertPosition);
          } else {
            // If no --- found, add at the end
            updatedBody = issue.body.trim() + '\n\n## Release Note\n' + value;
          }
        }

        // Update the issue on GitHub
        await updateIssue(
          issue.repository_url.split('/').slice(-2)[0], // owner
          issue.repository_url.split('/').slice(-1)[0], // repo
          issueNumber,
          updatedBody
        );

        // No toast notification for automatic saving
      } catch (error) {
        logger.error('Error auto-saving release note', { 
          error: error.message, 
          issueNumber,
          repoUrl: issue.repository_url 
        });
        // Silent error handling for auto-save
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(debounceTimeout);
  };

  // Function to toggle all rows
  const toggleAllRows = (filteredRows) => {
    if (expandedRows.size === filteredRows.length) {
      // If all rows are expanded, collapse all
      setExpandedRows(new Set());
    } else {
      // Expand all filtered rows
      setExpandedRows(new Set(filteredRows.map(row => row.id)));
    }
  };

  // Function to toggle single row
  const toggleRow = (rowId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Handle key down to prevent form submission
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return {
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
  };
};

export default useIssueData; 