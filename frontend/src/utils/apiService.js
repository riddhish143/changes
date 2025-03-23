/**
 * API service functions for interacting with the backend
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Fetch content from GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {boolean} isBackup - Whether to fetch backup.md instead of CHANGES.md
 * @returns {Promise} - Promise resolving to the API response
 */
export const fetchContent = async (owner, repo, branch, isBackup = false) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/fetch-content`, {
      params: {
        owner,
        repo,
        branch,
        isBackup
      }
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to fetch content');
  }
};

/**
 * Push content to GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {string} content - Content to push
 * @param {string} commitMessage - Commit message
 * @param {boolean} isBackup - Whether this is a backup file (saves to backup.md instead of CHANGES.md)
 * @returns {Promise} - Promise resolving to the API response
 */
export const pushContent = async (owner, repo, branch, content, commitMessage, isBackup = false) => {
  const response = await fetch(`${API_BASE_URL}/push-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      owner,
      repo,
      branch,
      content,
      commitMessage,
      isBackup
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to save CHANGES.md');
  }

  return data;
};

/**
 * Update an issue on GitHub
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} issueNumber - Issue number
 * @param {string} body - Updated issue body
 * @returns {Promise} - Promise resolving to the API response
 */
export const updateIssue = async (owner, repo, issueNumber, body) => {
  const response = await fetch(`${API_BASE_URL}/update-issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      owner,
      repo,
      issueNumber,
      body
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update issue');
  }

  return data;
};

/**
 * Update version in __init__.py file
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {string} version - New version number
 * @param {string} commitMessage - Commit message
 * @returns {Promise} - Promise resolving to the API response
 */
export const updateVersion = async (owner, repo, branch, version, commitMessage) => {
  try {
    const response = await fetch(`${API_BASE_URL}/update-version`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        owner,
        repo,
        branch,
        version,
        commitMessage
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update version');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating version:', error);
    throw error;
  }
};

/**
 * Create a pull request with changes to CHANGES.md and __init__.py files
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Base branch name
 * @param {string} content - Content for CHANGES.md
 * @param {string} version - New version number
 * @param {string} prTitle - Pull request title
 * @param {string} prBody - Pull request body
 * @param {string} milestone - Selected milestone title
 * @returns {Promise} - Promise resolving to the API response
 */
export const createPullRequest = async (owner, repo, branch, content, version, prTitle, prBody, milestone) => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-pull-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        owner,
        repo,
        branch,
        content,
        version,
        prTitle,
        prBody,
        milestone: milestone || version // Use the milestone parameter or fallback to version if not provided
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create pull request');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating pull request:', error);
    throw error;
  }
};

/**
 * Create a GitHub Gist with the provided content and return its URL
 * @param {string} content - The markdown content to save as a Gist
 * @returns {Promise} - Promise resolving to the API response with the Gist URL
 */
export const createGistLink = async (content) => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-gist-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create GitHub Gist');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Gist:', error);
    throw error;
  }
};

/**
 * Fetch content from a GitHub Gist using the backend endpoint
 * @param {string} gistUrl - The URL of the GitHub Gist
 * @returns {Promise} - Promise resolving to the API response with gist content
 */
export const fetchGistContent = async (gistUrl) => {
  try {
    // Extract gist ID and check if it's an enterprise GitHub URL
    const gistId = gistUrl.split('/').pop();
    const isEnterprise = gistUrl.includes('github.ibm.com');
    
    const response = await axios.get(`${API_BASE_URL}/fetch-gist`, {
      params: {
        gist_id: gistId,
        is_enterprise: isEnterprise
      }
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Failed to fetch content from GitHub Gist'
    );
  }
}; 