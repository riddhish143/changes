import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from config import GITHUB_API, github_headers, PER_PAGE, REQUEST_TIMEOUT, logger
import http

def create_session():
    """Create a requests session with retry logic"""
    session = requests.Session()
    retry_strategy = Retry(
        total=3,  # number of retries
        backoff_factor=1,  # wait 1, 2, 4 seconds between retries
        status_forcelist=[429, 500, 502, 503, 504],  # HTTP status codes to retry on
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

def make_github_request(url, params=None, headers=None):
    """Make a GitHub API request with proper error handling"""
    session = create_session()
    try:
        response = session.get(
            url,
            headers=headers or github_headers(),
            params=params,
            verify=True,
            timeout=REQUEST_TIMEOUT
        )
        
        if response.status_code == 404:
            logger.error(f"Resource not found: {url} - Status: {response.status_code}")
            return None, response.status_code, "Resource not found"
        elif response.status_code == 403:
            logger.error(f"Rate limit exceeded or access denied for {url} - Status: {response.status_code}, Response: {response.text[:200]}")
            return None, response.status_code, "Rate limit exceeded or access denied"
        elif response.status_code != 200:
            logger.error(f"GitHub API error for {url} - Status: {response.status_code}, Response: {response.text[:200]}")
            return None, response.status_code, response.text
            
        return response.json(), http.HTTPStatus.OK, None
        
    except requests.exceptions.Timeout:
        error_msg = f"Request timed out after {REQUEST_TIMEOUT} seconds for URL: {url}"
        logger.error(error_msg)
        return None, http.HTTPStatus.REQUEST_TIMEOUT, error_msg
    except requests.exceptions.ConnectionError as e:
        error_msg = f"Connection error occurred for URL: {url} - {str(e)}"
        logger.error(error_msg)
        return None, http.HTTPStatus.SERVICE_UNAVAILABLE, error_msg
    except requests.exceptions.RequestException as e:
        error_msg = f"Request failed for URL: {url} - {str(e)}"
        logger.error(error_msg)
        return None, http.HTTPStatus.INTERNAL_SERVER_ERROR, error_msg
    finally:
        session.close()

def get_all_branches(owner, repo):
    """
    Fetch all branches for a given repository with pagination
    """
    logger.debug(f"Starting to fetch branches for {owner}/{repo}")
    all_branches = []
    page = 1

    while True:
        url = f"{GITHUB_API}/repos/{owner}/{repo}/branches"
        params = {
            'per_page': PER_PAGE,
            'page': page
        }
        
        logger.debug(f"Fetching branches page {page} for {owner}/{repo}")
        data, status_code, error = make_github_request(url, params)
        if data is None:
            logger.error(f"Failed to fetch branches for {owner}/{repo} on page {page}: {error}")
            return None, status_code, error
            
        if not data:
            logger.debug(f"No more branches found for {owner}/{repo} on page {page}")
            break
            
        all_branches.extend(data)
        logger.debug(f"Added {len(data)} branches from page {page} for {owner}/{repo}")
        
        if len(data) < PER_PAGE:
            break
            
        page += 1
    
    logger.info(f"Successfully fetched {len(all_branches)} total branches for {owner}/{repo}")
    return all_branches, http.HTTPStatus.OK, None

def get_all_milestones(owner, repo):
    """
    Fetch all milestones (both active and closed) for a given repository with pagination
    """
    all_milestones = []
    page = 1

    while True:
        url = f"{GITHUB_API}/repos/{owner}/{repo}/milestones"
        params = {
            'state': 'active',  # Fetch both active and closed milestones
            'per_page': PER_PAGE,
            'page': page,
            'sort': 'due_date',  # Sort by due date
            'direction': 'desc'  # Most recent first
        }
        
        data, status_code, error = make_github_request(url, params)
        if data is None:
            return None, status_code, error
            
        if not data:
            break
            
        all_milestones.extend(data)
        
        if len(data) < PER_PAGE:
            break
            
        page += 1
    
    return all_milestones, http.HTTPStatus.OK, None

def get_all_issues(owner, repo, milestone):
    """
    Fetch all issues (both open and closed) for a given repository and milestone with pagination
    """
    all_issues = []
    page = 1
    
    while True:
        url = f"{GITHUB_API}/repos/{owner}/{repo}/issues"
        params = {
            'milestone': milestone,
            'state': 'all',
            'per_page': PER_PAGE,
            'page': page,
            'sort': 'updated',  # Sort by last updated
            'direction': 'desc'  # Most recently updated first
        }
        
        # Add Cache-Control header to prevent caching
        headers = github_headers()
        headers['Cache-Control'] = 'no-cache'
        
        data, status_code, error = make_github_request(url, params, headers)
        if data is None:
            return None, status_code, error
            
        if not data:
            break
            
        all_issues.extend(data)
        if len(data) < PER_PAGE:
            break
            
        page += 1
    
    return all_issues, http.HTTPStatus.OK, None 