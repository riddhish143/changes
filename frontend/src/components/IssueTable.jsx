import React from 'react';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableExpandHeader,
  TableExpandRow,
  TableExpandedRow,
  Button,
  Tag,
  Link,
  Checkbox,
} from '@carbon/react';
import { ChevronDown, ChevronUp } from '@carbon/icons-react';
import MarkdownEditor from './MarkdownEditor';

/**
 * IssueTable component for displaying issues in a table
 */
const IssueTable = ({
  rows,
  headers,
  expandedRows,
  toggleRow,
  toggleAllRows,
  editedReleaseNotes,
  handleReleaseNoteChange,
  repoOwner,
  repoName,
  selectedMilestone,
  milestones,
  filteredRows,
  selectedIssues,
  toggleIssueSelection,
  toggleAllIssueSelection
}) => {
  // Function to check if a row is expanded
  const isRowExpanded = (rowId) => expandedRows.has(rowId);

  // Check if all visible rows are selected
  const areAllSelected = rows.length > 0 && rows.every(row => selectedIssues[row.number]);

  return (
    <DataTable rows={rows} headers={headers}>
      {({
        rows,
        headers,
        getHeaderProps,
        getRowProps,
        getTableProps,
        getTableContainerProps,
        getExpandHeaderProps,
        getExpandedRowProps,
      }) => (
        <>
          <TableContainer
            title={
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  All Issues
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  color: '#525252'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <Tag type="outline" size="sm">{`Issues for ${repoOwner}/${repoName}`}</Tag>
                    <Tag type="outline" size="sm">{`Milestone: ${milestones?.find(m => m.id.toString() === selectedMilestone)?.title || 'Unknown'}`}</Tag>
                  </div>
                  <Button
                    kind="ghost"
                    size="sm"
                    onClick={toggleAllRows}
                    renderIcon={expandedRows.size === filteredRows.length ? ChevronUp : ChevronDown}
                    className="expand-collapse-btn"
                    style={{ padding: '0 12px', height: '24px', minHeight: '24px' }}
                  >
                    {expandedRows.size === filteredRows.length ? 'Collapse All' : 'Expand All'}
                  </Button>
                </div>
              </div>
            }
            {...getTableContainerProps()}
          >
            <Table {...getTableProps()} aria-label="issues table">
              <TableHead>
                <TableRow>
                  <TableExpandHeader {...getExpandHeaderProps()} />
                  {headers.map((header) => {
                    if (header.key === 'selected') {
                      return (
                        <TableHeader key={header.key} {...getHeaderProps({ header })}>
                          <Checkbox 
                            id="select-all-issues"
                            labelText=""
                            hideLabel
                            checked={areAllSelected}
                            onChange={() => toggleAllIssueSelection(areAllSelected)}
                          />
                        </TableHeader>
                      );
                    }
                    return (
                      <TableHeader key={header.key} {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableExpandRow
                      {...getRowProps({ row })}
                      isExpanded={isRowExpanded(row.id)}
                      onExpand={() => toggleRow(row.id)}
                    >
                      {row.cells.map((cell) => {
                        if (cell.id.includes('selected')) {
                          return (
                            <TableCell key={cell.id}>
                              <Checkbox 
                                id={`select-issue-${row.id}`}
                                labelText=""
                                hideLabel
                                checked={selectedIssues[row.id] || false}
                                onChange={() => toggleIssueSelection(row.id)}
                              />
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        );
                      })}
                    </TableExpandRow>
                    {isRowExpanded(row.id) && (
                      <TableExpandedRow
                        colSpan={headers.length + 1}
                        {...getExpandedRowProps({ row })}
                      >
                        <div style={{ padding: '1rem' }}>
                          <h4 style={{ marginBottom: '1rem' }}>Release Note</h4>
                          <div style={{ marginBottom: '1rem' }}>
                            <MarkdownEditor
                              initialValue={editedReleaseNotes[row.id] ?? row.releaseNote}
                              onChange={(value) => handleReleaseNoteChange(row.id, value)}
                            />
                          </div>
                        </div>
                      </TableExpandedRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </DataTable>
  );
};

export default IssueTable; 