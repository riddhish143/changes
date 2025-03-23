import { Stack } from '@chakra-ui/react';
import { FluidForm, TextInput, Dropdown, Button } from '@carbon/react';
import { Tag } from '@carbon/react';

const BranchSelector = ({
  branches,
  branchFilter,
  selectedBranch,
  onFilterChange,
  onBranchChange,
  onFetchMilestones,
  loading,
  fetchSuccess,
  fetchError
}) => {
  const branchItems = branches.map(branch => ({
    id: branch.name,
    text: branch.name,
    name: branch.name
  }));

  const filteredBranchItems = branchItems.filter(branch => 
    branch.text.toLowerCase().includes(branchFilter.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleBranchSelect = (selected) => {

    if (selected.selectedItem) {
      const branchName = selected.selectedItem.name || selected.selectedItem.id;
      onBranchChange({ selectedItem: { name: branchName } });
    } else {
      onBranchChange({ selectedItem: null });
    }
  };

  const handleFetchClick = (e) => {
    e.preventDefault();
    if (selectedBranch && !loading) {
      onFetchMilestones();
    }
  };

  return (
    <Stack spacing={4}>
      <FluidForm onSubmit={(e) => e.preventDefault()}>
        <TextInput
          id="branch-filter"
          labelText="Filter Branches"
          value={branchFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type to filter branches..."
          disabled={loading}
        />
       
        <div style={{ margin: '1rem 0' }}>
          <Tag type="blue" size="sm">
            Total branches: {branches.length}
          </Tag>
          {' '}
          <Tag type="gray" size="sm">
            Filtered: {filteredBranchItems.length}
          </Tag>
        </div>

        <div style={{ width: '100%', marginBottom: '1rem' }}>
          <Dropdown
            id="branch-select"
            // titleText="Select Branch"
            helperText="Choose a branch to view its milestones"
            label="Choose a branch"
            items={filteredBranchItems}
            itemToString={(item) => item?.text || ''}
            onChange={handleBranchSelect}
            selectedItem={branchItems.find(item => item.id === selectedBranch)}
            disabled={loading}
          />
        </div>

        <Button
          kind={fetchError ? "danger" : "primary"}
          disabled={!selectedBranch || loading}
          onClick={handleFetchClick}
          type="submit"
          style={{ 
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? 'Loading...' : (
            <>
              Fetch Milestones
              {fetchSuccess && !loading && (
                <span style={{ marginLeft: '0.5rem', fontSize: '1.2rem' }}>✓</span>
              )}
              {fetchError && !loading && (
                <span style={{ marginLeft: '0.5rem', fontSize: '1.2rem' }}>↻</span>
              )}
            </>
          )}
        </Button>
      </FluidForm>
    </Stack>
  );
};

export default BranchSelector; 