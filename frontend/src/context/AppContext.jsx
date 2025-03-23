import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import useApi from '../hooks/useApi';
import { hasRequiredParams } from '../utils/urlValidator';

// Create context
export const AppContext = createContext();

// Constants
export const GITHUB_ENTERPRISE_URL = 'https://github.ibm.com';

export const AppProvider = ({ children }) => {
  const toast = useToast();
  const { fetchBranches, fetchMilestones, fetchIssues } = useApi();

  // Repository state
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');

  // Branch state
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [branchesFetched, setBranchesFetched] = useState(false);
  const [branchesError, setBranchesError] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Milestone state
  const [milestones, setMilestones] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [milestonesFetched, setMilestonesFetched] = useState(false);
  const [milestonesError, setMilestonesError] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  // Issues state
  const [issues, setIssues] = useState([]);
  const [issuesFetched, setIssuesFetched] = useState(false);
  const [issuesError, setIssuesError] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // App state
  const [currentStep, setCurrentStep] = useState('initial');
  const [changelogGenerated, setChangelogGenerated] = useState(false);
  const [changelogError, setChangelogError] = useState(false);
  const [autoFetch, setAutoFetch] = useState(false);

  // Fetch branches handler
  const handleFetchBranches = useCallback(async () => {
    if (!repoOwner || !repoName) return;
    
    setLoadingBranches(true);
    setBranchesError(false);
    setBranchesFetched(false);
    setIssuesFetched(false);
    setMilestonesFetched(false);

    try {
      const { data, error } = await fetchBranches(repoOwner, repoName);
      
      if (error) {
        setBranchesError(true);
        setBranches([]);
        return;
      }

      setBranches(data);
      setBranchesFetched(true);

      // Check for desired branch immediately after setting branches
      const desiredBranch = sessionStorage.getItem('desiredBranch');
      
      if (desiredBranch) {
        // Try to find the branch by name
        const branch = data.find(b => b.name === desiredBranch);
        if (branch) {
          setSelectedBranch(branch.name);
          sessionStorage.removeItem('desiredBranch');
        }
      }

      toast({
        title: 'Success',
        description: `Successfully fetched ${data.length} branches`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'bottom-right'
      });
    } finally {
      setLoadingBranches(false);
    }
  }, [repoOwner, repoName, fetchBranches, toast]);

  // Fetch milestones handler
  const handleFetchMilestones = useCallback(async () => {
    if (!selectedBranch) {
      return;
    }

    setLoadingMilestones(true);
    setMilestonesError(null);
    setMilestonesFetched(false);

    try {
      const { data, error } = await fetchMilestones(repoOwner, repoName, selectedBranch);
      
      if (error) {
        setMilestonesError(error);
        setMilestones([]);
        return;
      }

      setMilestones(data);
      setMilestonesFetched(true);

      // Check for desired milestone from session storage
      const desiredMilestone = sessionStorage.getItem('desiredMilestone');
      if (desiredMilestone) {
        
        // Try all possible matches
        let foundMilestone = data.find(m => 
          m.id === desiredMilestone ||
          m.title === desiredMilestone ||
          m.title.toLowerCase() === desiredMilestone.toLowerCase()
        );

        if (foundMilestone) {
          setSelectedMilestone(foundMilestone.id);
          sessionStorage.removeItem('desiredMilestone');
        } else {
          toast({
            title: 'Milestone not found',
            description: `Could not find milestone "${desiredMilestone}"`,
            status: 'warning',
            duration: 2000,
            isClosable: true,
            position: 'bottom-right'
          });
        }
      }

      toast({
        title: 'Milestones fetched',
        description: `Found ${data.length} milestones`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'bottom-right'
      });
    } finally {
      setLoadingMilestones(false);
    }
  }, [selectedBranch, repoOwner, repoName, fetchMilestones, toast]);

  // Fetch issues handler
  const handleFetchIssues = useCallback(async () => {
    if (!selectedMilestone) return;
    
    setLoadingIssues(true);
    setIssuesError(false);
    setIssuesFetched(false);
    setChangelogGenerated(false);
    setChangelogError(false);

    try {
      const { data, error } = await fetchIssues(repoOwner, repoName, selectedBranch, selectedMilestone);
      
      if (error) {
        setIssuesError(true);
        setIssues([]);
        return;
      }

      // Clear existing issues first
      setIssues([]);
      // Then set the new issues
      setIssues(data);
      setCurrentStep('issues');
      setIssuesFetched(true);

      toast({
        title: 'Success',
        description: `Successfully fetched ${data.length} issues`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'bottom-right'
      });
    } finally {
      setLoadingIssues(false);
    }
  }, [selectedMilestone, repoOwner, repoName, selectedBranch, fetchIssues, toast]);

  // Parse URL parameters and set initial state
  useEffect(() => {
    // Get parameters from hash portion of URL for HashRouter
    const hashParams = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hashParams.includes('?') ? hashParams.substring(hashParams.indexOf('?')) : '');
    
    // Check if the URL has the minimum required parameters (owner and repo)
    if (!hasRequiredParams(params)) {
      // This is either the home page or an invalid URL
      return;
    }
    
    // Extract parameters
    const owner = params.get('owner');
    const repo = params.get('repo');
    const branch = params.get('branch');
    const milestone = params.get('milestone');
    
    // Check for autoFetch parameter in a case-insensitive way
    const autoFetchParam = 
      params.get('autoFetch') || 
      params.get('autofetch') || 
      params.get('AUTOFETCH') || 
      params.get('Autofetch');
    const shouldAutoFetch = autoFetchParam === 'true';

    // Process parameters
    setRepoOwner(owner);
    setRepoName(repo);
    setAutoFetch(shouldAutoFetch);
    
    // Only store branch and milestone in session storage if they are provided
    if (branch) {
      sessionStorage.setItem('desiredBranch', branch);
    }
    
    if (milestone) {
      sessionStorage.setItem('desiredMilestone', milestone);
    }
    
    // Manually trigger the fetch process after a short delay to ensure state is updated
    if (shouldAutoFetch && owner && repo) {
      setTimeout(() => {
        fetchBranches(owner, repo)
          .then(({ data, error }) => {
            if (!error && data) {
              setBranches(data);
              setBranchesFetched(true);
              
              // If branch parameter was provided, try to select it
              if (branch) {
                const branchObj = data.find(b => b.name === branch);
                if (branchObj) {
                  setSelectedBranch(branchObj.name);
                }
              }
            }
          });
      }, 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fetch branches when repository is set
  useEffect(() => {
    
    if (repoOwner && repoName && autoFetch && !branchesFetched) {
      handleFetchBranches();
    }
  }, [repoOwner, repoName, handleFetchBranches, autoFetch, branchesFetched]);

  // Auto-fetch milestones when branch is selected
  useEffect(() => {
    
    
    if (selectedBranch && autoFetch && !milestonesFetched) {
      handleFetchMilestones();
    }
  }, [selectedBranch, handleFetchMilestones, autoFetch, milestonesFetched]);

  // Auto-fetch issues when milestone is selected
  useEffect(() => {
    
    
    if (selectedMilestone && autoFetch && !issuesFetched) {
      handleFetchIssues();
    }
  }, [selectedMilestone, handleFetchIssues, autoFetch, issuesFetched]);

  // Add auto-trigger for branch selection
  useEffect(() => {
    
    if (branches.length > 0 && autoFetch) {
      const desiredBranch = sessionStorage.getItem('desiredBranch');
      if (desiredBranch) {
        const branch = branches.find(b => b.name === desiredBranch);
        if (branch) {
          setSelectedBranch(branch.name);
          sessionStorage.removeItem('desiredBranch');
          
          // Manually trigger milestone fetch after a short delay
          setTimeout(() => {
            handleFetchMilestones();
          }, 300);
        }
      }
    }
  }, [branches, autoFetch, handleFetchMilestones]);

  // Add auto-trigger for milestone selection
  useEffect(() => {
    
    if (milestones.length > 0 && autoFetch) {
      const desiredMilestone = sessionStorage.getItem('desiredMilestone');
      if (desiredMilestone) {
        const milestone = milestones.find(m => 
          m.id === desiredMilestone ||
          m.title === desiredMilestone ||
          m.title.toLowerCase() === desiredMilestone.toLowerCase()
        );
        if (milestone) {
          setSelectedMilestone(milestone.id);
          sessionStorage.removeItem('desiredMilestone');
          
          // Manually trigger issues fetch after a short delay
          setTimeout(() => {
            handleFetchIssues();
          }, 300);
        }
      }
    }
  }, [milestones, autoFetch, handleFetchIssues]);

  // Handle branch change
  const handleBranchChange = useCallback((selected) => {
    if (selected.selectedItem) {
      const branchName = selected.selectedItem.name || selected.selectedItem.id;
      setSelectedBranch(branchName);
      // Reset milestone-related states when branch changes
      setMilestones([]);
      setSelectedMilestone('');
      setIssues([]);
      setIssuesFetched(false);
      setMilestonesFetched(false);
    } else {
      setSelectedBranch('');
    }
  }, []);

  // Handle milestone change
  const handleMilestoneChange = useCallback((selected) => {
      if (selected.selectedItem) {
      const milestoneId = selected.selectedItem.id;
      setSelectedMilestone(milestoneId);
      // Reset issues when milestone changes
      setIssues([]);
      setIssuesFetched(false);
    } else {
      setSelectedMilestone('');
    }
  }, []);

  // Handle changelog generation
  const handleChangelogGeneration = useCallback((generated) => {
    setChangelogGenerated(generated);
  }, []);

  // Calculate current step for the Steps component
  const getCurrentStep = useCallback(() => {
    // Step 0: Repository selection
    if (!repoOwner || !repoName) return 0;
    
    // Step 1: Branch selection
    // If we have owner and repo but no branch, we're at step 1
    if (!selectedBranch) {
      // If branches are loaded but none selected, we're at step 1
      if (branches.length > 0) return 1;
      // If branches aren't loaded yet, we're still at step 0 (waiting for branch fetch)
      return 0;
    }
    
    // Step 2: Milestone selection
    // If we have owner, repo, and branch but no milestone, we're at step 2
    if (!selectedMilestone) {
      // If milestones are loaded but none selected, we're at step 2
      if (milestones.length > 0) return 2;
      // If milestones aren't loaded yet, we're still at step 1 (waiting for milestone fetch)
      return 1;
    }
    
    // Step 3: Issues fetched
    if (!issuesFetched) return 3;
    
    // Step 4: Changelog generated
    return changelogGenerated ? 4 : 3;
  }, [repoOwner, repoName, selectedBranch, selectedMilestone, issuesFetched, changelogGenerated, branches.length, milestones.length]);

  // Reset states when repository changes
  useEffect(() => {
    if (repoOwner || repoName) {
      setBranches([]);
      setSelectedBranch('');
      setMilestones([]);
      setSelectedMilestone('');
      setIssues([]);
      setIssuesFetched(false);
      setChangelogGenerated(false);
      setBranchesFetched(false);
      setMilestonesFetched(false);
      setBranchesError(false);
      setMilestonesError(false);
      setIssuesError(false);
      setChangelogError(false);
    }
  }, [repoOwner, repoName]);

  // Context value
  const contextValue = {
    // Repository state
    repoOwner,
    repoName,
    setRepoOwner,
    setRepoName,

    // Branch state
    branches,
    selectedBranch,
    branchFilter,
    branchesFetched,
    branchesError,
    loadingBranches,
    setBranchFilter,
    setSelectedBranch,

    // Milestone state
    milestones,
    selectedMilestone,
    milestonesFetched,
    milestonesError,
    loadingMilestones,
    setSelectedMilestone,

    // Issues state
    issues,
    issuesFetched,
    issuesError,
    loadingIssues,
    setIssues,

    // App state
    currentStep,
    changelogGenerated,
    changelogError,
    setChangelogError,

    // Handlers
    handleFetchBranches,
    handleFetchMilestones,
    handleFetchIssues,
    handleBranchChange,
    handleMilestoneChange,
    handleChangelogGeneration,
    getCurrentStep
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppProvider; 