import { useState, useEffect } from 'react';
import { Stack, Text } from '@chakra-ui/react';
import { FluidForm, TextInput, Dropdown, Button } from '@carbon/react';
import { Tag } from '@carbon/react';

const MilestoneSelector = ({ 
  milestones, 
  selectedMilestone, 
  onMilestoneChange,
  onFetchIssues,
  loading,
  issuesFetched,
  fetchError
}) => {
  const [milestoneFilter, setMilestoneFilter] = useState('');

  // Ensure milestones are properly formatted for the dropdown
  const milestoneItems = milestones.map(milestone => ({
    id: milestone.id.toString(),
    text: milestone.title,
    title: milestone.title,
    state: milestone.state
  }));

  const filteredMilestoneItems = milestoneItems.filter(milestone => 
    milestone.text.toLowerCase().includes(milestoneFilter.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };


  return (
    <Stack spacing={4}>
      <FluidForm onSubmit={(e) => e.preventDefault()}>
        <TextInput
          id="milestone-filter"
          labelText="Filter Milestones"
          value={milestoneFilter}
          onChange={(e) => setMilestoneFilter(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type to filter milestones..."
        />

        <div style={{ margin: '1rem 0' }}>
          <Tag type="blue" size="sm">
            Total milestones: {milestones.length}
          </Tag>
          {' '}
          <Tag type="gray" size="sm">
            Filtered: {filteredMilestoneItems.length}
          </Tag>
        </div>

        <div style={{ width: '100%', marginBottom: '1rem' }}>
          <Dropdown
            id="milestone-select"
            // titleText="Select Milestone"
            helperText="Choose a milestone to view all its issues"
            items={filteredMilestoneItems}
            itemToString={(item) => item?.text || ''}
            onChange={onMilestoneChange}
            selectedItem={milestoneItems.find(item => item.id === selectedMilestone)}
            disabled={loading}
            label="Select a milestone"
          />
        </div>

        <Button
          kind="primary"
          disabled={!selectedMilestone || loading}
          onClick={onFetchIssues}
          style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {loading ? 'Loading...' : (
            <>
              Fetch All Issues
              {issuesFetched && !loading && (
                <span style={{ marginLeft: '0.5rem', fontSize: '1.2rem' }}>✓</span>
              )}
            </>
          )}
        </Button>

        {fetchError && (
          <Text color="red.500" mt={2}>
            Error: {fetchError}
          </Text>
        )}
      </FluidForm>
    </Stack>
  );
};

export default MilestoneSelector; 