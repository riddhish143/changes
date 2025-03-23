import React from 'react';
import { FluidForm, TextInput, Tag } from '@carbon/react';

/**
 * IssueFilter component for filtering issues
 */
const IssueFilter = ({ issueFilter, setIssueFilter, allRows, filteredRows, handleKeyDown }) => {
  return (
    <FluidForm onSubmit={(e) => e.preventDefault()}>
      <div style={{ marginBottom: '1rem' }}>
        <TextInput
          id="issue-filter"
          labelText="Filter Issues"
          value={issueFilter}
          onChange={(e) => setIssueFilter(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by issue title or number..."
        />
      </div>

      <div style={{ margin: '1rem 0' }}>
        <Tag type="blue" size="sm">
          Total issues: {allRows.length}
        </Tag>
        {' '}
        <Tag type="gray" size="sm">
          Filtered: {filteredRows.length}
        </Tag>
      </div>
    </FluidForm>
  );
};

export default IssueFilter; 