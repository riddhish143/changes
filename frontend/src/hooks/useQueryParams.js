import { useEffect } from 'react';
import { fetchGistContent } from '../utils/apiService';

export const useQueryParams = (onOpenEditor, onError = null) => {
  useEffect(() => {
    // Get parameters from hash portion of URL for HashRouter
    // Example: /#/?param=value becomes /?param=value
    const hashParams = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hashParams.includes('?') ? hashParams.substring(hashParams.indexOf('?')) : '');
    
    const shouldOpenEditor = params.get('openEditor');
    const content = params.get('content');
    const gistUrl = params.get('gistUrl');
    const popupType = params.get('popup');
    
    // Extract repository information
    const repoOwner = params.get('repoOwner');
    const repoName = params.get('repoName');
    const branch = params.get('branch');
    const version = params.get('version');

    const processParams = async () => {
      try {
        if (shouldOpenEditor === 'true') {
          if (gistUrl) {
            // If we have a Gist URL, fetch its content using the backend endpoint
            console.log(`Fetching content from Gist: ${gistUrl}`);
            const gistResponse = await fetchGistContent(gistUrl);
            
            // Pass the fetched content to the onOpenEditor callback
            onOpenEditor(
              gistResponse.content,
              popupType,
              { repoOwner, repoName, branch, version }
            );
          } else if (content) {
            // If we have content directly in the URL, use that
            onOpenEditor(
              decodeURIComponent(content),
              popupType,
              { repoOwner, repoName, branch, version }
            );
          }
          
          // Clean up the URL without refreshing the page
          const newUrl = window.location.pathname;
          window.history.pushState({}, '', newUrl);
        }
      } catch (error) {
        console.error('Error processing URL parameters:', error);
        
        // If an error callback is provided, use it
        if (onError && typeof onError === 'function') {
          onError(error.message || 'Error loading shared content');
        } else {
          // Otherwise fall back to an alert
          alert(`Error loading content: ${error.message}`);
        }
      }
    };

    if (shouldOpenEditor === 'true' && (content || gistUrl)) {
      processParams();
    }
  }, [onOpenEditor, onError]);
}; 