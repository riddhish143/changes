import { Stack, Text } from '@chakra-ui/react';
import { FluidForm, TextInput, Button } from '@carbon/react';
import { useState, useEffect } from 'react';

const RepositoryForm = ({ 
  repoOwner, 
  repoName, 
  loading, 
  currentStep,
  onOwnerChange, 
  onNameChange, 
  onFetch,
  fetchSuccess,
  fetchError
}) => {
  const [ownerError, setOwnerError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [localOwner, setLocalOwner] = useState(repoOwner);
  const [localName, setLocalName] = useState(repoName);

  // Validate input on change
  const validateInput = (value, type) => {
    if (!value || !value.trim()) {
      return `${type} is required`;
    }
    const validPattern = /^[a-zA-Z0-9-_.]*$/;
    if (!validPattern.test(value)) {
      return `${type} can only contain letters, numbers, hyphens, underscores, and dots`;
    }
    if (value.length > 100) {
      return `${type} must be less than 100 characters`;
    }
    return '';
  };

  // Handle owner input change
  const handleOwnerChange = (e) => {
    const value = e.target.value;
    setLocalOwner(value);
    const error = validateInput(value, 'Repository owner');
    setOwnerError(error);
    onOwnerChange(value.trim()); // Update parent state immediately
  };

  // Handle name input change
  const handleNameChange = (e) => {
    const value = e.target.value;
    setLocalName(value);
    const error = validateInput(value, 'Repository name');
    setNameError(error);
    onNameChange(value.trim()); // Update parent state immediately
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!isValid || loading) return;
    onFetch(); // Just trigger fetch since state is already updated
  };

  // Update form validity
  useEffect(() => {
    const ownerValid = localOwner.trim() !== '' && !ownerError;
    const nameValid = localName.trim() !== '' && !nameError;
    setIsValid(ownerValid && nameValid);
  }, [localOwner, localName, ownerError, nameError]);

  // Update local state when props change
  useEffect(() => {
    if (repoOwner !== localOwner) setLocalOwner(repoOwner);
    if (repoName !== localName) setLocalName(repoName);
  }, [repoOwner, repoName]);

  return (
    <Stack spacing={4}>
      <Text color="gray.600" fontSize="sm">
        Note: Make sure you have the correct GitHub Enterprise token with appropriate permissions.
      </Text>
      
      <FluidForm onSubmit={handleSubmit}>
        <TextInput
          id="repo-owner"
          labelText="Repository Owner"
          value={localOwner}
          onChange={handleOwnerChange}
          placeholder="Enter repository owner (e.g., auditree)"
          invalid={!!ownerError}
          invalidText={ownerError}
          required
          disabled={currentStep !== 'initial' || loading}
        />

        <TextInput
          id="repo-name"
          labelText="Repository Name"
          value={localName}
          onChange={handleNameChange}
          placeholder="Enter repository name (e.g., auditree-central)"
          invalid={!!nameError}
          invalidText={nameError}
          required
          disabled={currentStep !== 'initial' || loading}
        />

        <Button
          kind={fetchError ? "danger" : "primary"}
          disabled={!isValid || loading}
          onClick={handleSubmit}
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
              Fetch Repository
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

export default RepositoryForm; 