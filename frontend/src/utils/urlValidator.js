/**
 * Validates if the current URL matches one of the allowed patterns:
 * 1. http://localhost:3000/ (root with no parameters)
 * 2. http://localhost:3000/?owner=X&repo=Y (with minimum required parameters)
 * 3. http://localhost:3000/?owner=X&repo=Y&branch=Z (with optional branch)
 * 4. http://localhost:3000/?owner=X&repo=Y&milestone=W (with optional milestone)
 * 5. http://localhost:3000/?owner=X&repo=Y&branch=Z&milestone=W (with all parameters)
 * 6. http://localhost:3000/?openEditor=true&content=X (shared markdown view with direct content)
 * 7. http://localhost:3000/?openEditor=true&gistUrl=X (shared markdown view with Gist URL)
 * 
 * @param {string} pathname - The current pathname
 * @param {URLSearchParams} searchParams - The URL search parameters
 * @returns {boolean} - Whether the URL is valid
 */
export const isValidUrl = (pathname, searchParams) => {
  // If the pathname is not root, it's invalid
  if (pathname !== '/') {
    return false;
  }
  
  // Pattern 1: Root URL with no parameters
  if (pathname === '/' && searchParams.toString() === '') {
    return true;
  }

  // Pattern 6 & 7: Shared markdown view
  const openEditor = searchParams.get('openEditor');
  const content = searchParams.get('content');
  const gistUrl = searchParams.get('gistUrl');
  
  if (pathname === '/' && openEditor === 'true' && (content || gistUrl)) {
    return true;
  }
  
  // For all other patterns: owner and repo are required
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  
  // As long as we have owner and repo, the URL is valid
  // branch and milestone are optional
  if (pathname === '/' && owner && repo) {
    return true;
  }
  
  return false;
};

/**
 * Checks if the URL has the minimum required parameters (owner and repo)
 * or is a valid shared markdown view URL
 * 
 * @param {URLSearchParams} searchParams - The URL search parameters
 * @returns {boolean} - Whether the URL has the required parameters
 */
export const hasRequiredParams = (searchParams) => {
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const openEditor = searchParams.get('openEditor');
  const content = searchParams.get('content');
  const gistUrl = searchParams.get('gistUrl');
  
  return (owner && repo) || (openEditor === 'true' && (content || gistUrl));
}; 