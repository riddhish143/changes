import { useCallback } from 'react';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';

const API_BASE_URL = 'https://changes-lwdc.onrender.com/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const useApi = () => {
  const toast = useToast();

  const handleError = useCallback((error, context) => {
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.details || 
                        error.message || 
                        'An unexpected error occurred';
    
    toast({
      title: `Error ${context}`,
      description: errorMessage,
      status: 'error',
      duration: 2000,
      isClosable: true,
      position: 'bottom-right'
    });

    return { errorMessage, status: error.response?.status || 500 };
  }, [toast]);

  // Create axios instance with retry logic
  const axiosWithRetry = useCallback(async (config, retries = MAX_RETRIES) => {
    try {
      return await axios(config);
    } catch (error) {
      if (retries === 0 || (error.response && error.response.status < 500)) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return axiosWithRetry(config, retries - 1);
    }
  }, []);

  const fetchBranches = useCallback(async (repoOwner, repoName) => {
    if (!repoOwner || !repoName) {
      return { data: [], error: null };
    }
    
    try {
      const response = await axiosWithRetry({
        method: 'get',
        url: `${API_BASE_URL}/branches`,
        params: { owner: repoOwner, repo: repoName }
      });

      return { 
        data: response.data, 
        error: null 
      };
    } catch (error) {
      const { errorMessage } = handleError(error, 'fetching branches');
      console.error('Error fetching branches:', errorMessage);
      return { 
        data: [], 
        error: errorMessage 
      };
    }
  }, [axiosWithRetry, handleError]);

  const fetchMilestones = useCallback(async (repoOwner, repoName, selectedBranch) => {
    if (!selectedBranch) {
      return { data: [], error: null };
    }

    try {
      const response = await axiosWithRetry({
        method: 'get',
        url: `${API_BASE_URL}/milestones`,
        params: { owner: repoOwner, repo: repoName, branch: selectedBranch }
      });

      const milestonesList = response.data;
      
      // Process milestones to ensure they have string IDs and are properly formatted
      const processedMilestones = milestonesList.map(m => ({
        ...m,
        id: m.id.toString(),
        text: m.title // Ensure the text property is set for the dropdown
      }));
      
      return { 
        data: processedMilestones, 
        error: null 
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      handleError(error, 'fetching milestones');
      return { 
        data: [], 
        error: errorMessage 
      };
    }
  }, [axiosWithRetry, handleError]);

  const fetchIssues = useCallback(async (repoOwner, repoName, selectedBranch, selectedMilestone) => {
    if (!selectedMilestone) {
      return { data: [], error: null };
    }
    
    try {
      const response = await axiosWithRetry({
        method: 'get',
        url: `${API_BASE_URL}/issues`,
        params: {
          owner: repoOwner,
          repo: repoName,
          branch: selectedBranch,
          milestone: selectedMilestone
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      return { 
        data: response.data, 
        error: null 
      };
    } catch (error) {
      const { errorMessage } = handleError(error, 'fetching issues');
      return { 
        data: [], 
        error: errorMessage 
      };
    }
  }, [axiosWithRetry, handleError]);

  return {
    fetchBranches,
    fetchMilestones,
    fetchIssues,
    handleError,
    axiosWithRetry
  };
};

export default useApi; 
