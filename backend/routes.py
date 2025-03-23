from flask import Blueprint, request, jsonify
from config import GITHUB_TOKEN, GITHUB_API, REQUEST_TIMEOUT, logger 
from controllers import get_all_branches, get_all_milestones, get_all_issues
import http
from github import GithubException, Github, Gist, InputFileContent
import re
import time

# Create a Blueprint for our API routes
api = Blueprint('api', __name__)

def validate_repo_params():
    """Validate common repository parameters"""
    repo_owner = request.args.get('owner', '').strip()
    repo_name = request.args.get('repo', '').strip()
    
    # Check for empty strings after stripping
    if not repo_owner or not repo_name:
        error_msg = 'Repository owner and name cannot be empty'
        logger.error(error_msg)
        return None, (jsonify({'error': error_msg}), http.HTTPStatus.BAD_REQUEST)
    
    # Validate characters in repo owner and name
    if not all(c.isalnum() or c in '-_.' for c in repo_owner) or not all(c.isalnum() or c in '-_.' for c in repo_name):
        error_msg = 'Repository owner and name can only contain alphanumeric characters, hyphens, underscores, and dots'
        logger.error(error_msg)
        return None, (jsonify({'error': error_msg}), http.HTTPStatus.BAD_REQUEST)
    
    if not GITHUB_TOKEN:
        error_msg = 'GitHub token is not configured'
        logger.error(error_msg)
        return None, (jsonify({'error': error_msg}), http.HTTPStatus.UNAUTHORIZED)
    
    return (repo_owner, repo_name), None

@api.route('/branches', methods=['GET'])
def get_branches():
    """Get all branches for a repository"""
    params, error = validate_repo_params()
    if error:
        return error
    
    repo_owner, repo_name = params
    logger.info(f"Fetching all branches for {repo_owner}/{repo_name}")
    
    branches, status_code, error_message = get_all_branches(repo_owner, repo_name)
    
    if branches is None:
        return jsonify({
            'error': 'Failed to fetch branches',
            'details': error_message
        }), status_code
    
    branches.sort(key=lambda x: x['name'].lower())
    branch_list = [{'id': branch['name'], 'name': branch['name']} for branch in branches]
    
    logger.info(f"Successfully fetched {len(branch_list)} branches")
    return jsonify(branch_list)

@api.route('/milestones', methods=['GET'])
def get_milestones():
    """Get all milestones for a repository"""
    params, error = validate_repo_params()
    if error:
        return error
    
    repo_owner, repo_name = params
    logger.info(f"Fetching all milestones for {repo_owner}/{repo_name}")
    
    milestones, status_code, error_message = get_all_milestones(repo_owner, repo_name)
    
    if milestones is None:
        return jsonify({
            'error': 'Failed to fetch milestones',
            'details': error_message
        }), status_code
    
    milestone_list = [{
        'id': milestone['number'],
        'title': milestone['title'],
        'description': milestone['description'],
        'state': milestone['state']
    } for milestone in milestones]
    
    logger.info(f"Successfully fetched {len(milestone_list)} milestones")
    return jsonify(milestone_list)

@api.route('/issues', methods=['GET'])
def get_issues():
    """Get all closed issues for a repository and milestone"""
    params, error = validate_repo_params()
    if error:
        return error
    
    repo_owner, repo_name = params
    milestone = request.args.get('milestone')
    
    if not milestone:
        error_msg = 'Missing milestone parameter'
        logger.error(f"{error_msg}. owner: {repo_owner}, repo: {repo_name}")
        return jsonify({'error': error_msg}), http.HTTPStatus.BAD_REQUEST
    
    logger.info(f"Fetching issues for {repo_owner}/{repo_name}, milestone: {milestone}")
    
    issues, status_code, error_message = get_all_issues(repo_owner, repo_name, milestone)
    
    if issues is None:
        return jsonify({
            'error': 'Failed to fetch issues',
            'details': error_message
        }), status_code
    
    issue_list = [{
        'number': issue['number'],
        'title': issue['title'],
        'state': issue['state'],
        'created_at': issue['created_at'],
        'closed_at': issue['closed_at'],
        'html_url': issue['html_url'],
        'body': issue['body']
    } for issue in issues]
    
    logger.info(f"Successfully fetched {len(issue_list)} issues")
    return jsonify(issue_list) 

@api.route('/push-content', methods=['POST'])
def push_content():
    try:
        logger.info("Received push-content request")
        # Get data from request
        data = request.json
        if not data:
            error_msg = 'No JSON data provided'
            logger.error(error_msg)
            return jsonify({'error': error_msg}), http.HTTPStatus.BAD_REQUEST

        required_fields = ['content', 'commitMessage']
        
        # Validate required fields
        if not all(field in data for field in required_fields):
            missing_fields = [field for field in required_fields if field not in data]
            error_msg = f'Missing required fields: {", ".join(missing_fields)}'
            logger.error(f"Validation error: {error_msg}")
            return jsonify({
                'error': error_msg
            }), http.HTTPStatus.BAD_REQUEST

        # Validate field contents
        for field in required_fields:
            if not isinstance(data[field], str) or not data[field].strip():
                error_msg = f'Field {field} must be a non-empty string'
                logger.error(f"Validation error: {error_msg}")
                return jsonify({
                    'error': error_msg
                }), http.HTTPStatus.BAD_REQUEST

        # Hardcoded repository information
        repo_owner = "riddhishmahajan6822"
        repo_name = "Backup"
        branch_name = "main"
        file_name = "backup.md"
        content = data['content'].strip()
        commit_message = data['commitMessage'].strip()

        logger.info(f"Processing request for IBM repository: {repo_owner}/{repo_name}, branch: {branch_name}, file: {file_name}")

        try:
            # Initialize GitHub with token from environment
            logger.debug("Initializing GitHub client")
            g = Github(
                base_url=GITHUB_API,
                login_or_token=GITHUB_TOKEN,
                timeout=REQUEST_TIMEOUT
            )
            
            # First verify the authenticated user
            try:
                user = g.get_user()
                logger.info(f"Successfully authenticated as: {user.login}")
            except GithubException as e:
                error_msg = f'Authentication failed: {str(e)}. Please check your access token.'
                logger.error(f"Authentication error: {str(e)}")
                return jsonify({
                    'error': error_msg
                }), http.HTTPStatus.UNAUTHORIZED

            # Try to get the repository
            try:
                logger.info(f"Attempting to access repository: {repo_owner}/{repo_name}")
                repo = g.get_repo(f"{repo_owner}/{repo_name}")
            except GithubException as e:
                if e.status == 404:
                    error_msg = f'Repository {repo_owner}/{repo_name} not found. Please check the repository owner and name.'
                    logger.error(f"Repository not found: {error_msg}")
                    return jsonify({
                        'error': error_msg
                    }), http.HTTPStatus.NOT_FOUND
                raise e

            # Verify branch exists
            try:
                repo.get_branch(branch_name)
            except GithubException as e:
                if e.status == 404:
                    error_msg = f'Branch {branch_name} not found in repository {repo_owner}/{repo_name}'
                    logger.error(f"Branch not found: {error_msg}")
                    return jsonify({
                        'error': error_msg
                    }), http.HTTPStatus.NOT_FOUND
                raise e

            try:
                # Try to get the existing file
                logger.info(f"Checking if {file_name} exists in branch: {branch_name}")
                file = repo.get_contents(file_name, ref=branch_name)
                # Update existing file
                logger.info(f"Updating existing {file_name} file")
                result = repo.update_file(
                    path=file_name,
                    message=commit_message,
                    content=content,
                    sha=file.sha,
                    branch=branch_name
                )
                logger.info("File updated successfully")
                return jsonify({
                    'message': 'File updated successfully',
                    'status': 'success',
                    'commit': {
                        'sha': result['commit'].sha,
                        'html_url': result['commit'].html_url
                    }
                })
            except GithubException as e:
                if e.status == 404:  # File not found
                    try:
                        # Create new file since it doesn't exist
                        logger.info(f"{file_name} not found, creating new file")
                        result = repo.create_file(
                            path=file_name,
                            message=commit_message,
                            content=content,
                            branch=branch_name
                        )
                        logger.info("File created successfully")
                        return jsonify({
                            'message': 'File created successfully',
                            'status': 'success',
                            'commit': {
                                'sha': result['commit'].sha,
                                'html_url': result['commit'].html_url
                            }
                        })
                    except GithubException as create_error:
                        error_msg = f'Failed to create file: {str(create_error)}. Make sure you have write permissions to the repository.'
                        logger.error(f"File creation error: {error_msg}")
                        return jsonify({
                            'error': error_msg
                        }), create_error.status
                else:
                    logger.error(f"GitHub API error: {str(e)}")
                    return jsonify({
                        'error': f'GitHub API error: {str(e)}'
                    }), e.status

        except GithubException as e:
            logger.error(f"GitHub API error: {str(e)}. Status: {e.status}")
            return jsonify({
                'error': f'GitHub API error: {str(e)}. Status: {e.status}'
            }), e.status
        except Exception as e:
            logger.error(f"Repository error: {str(e)}", exc_info=True)
            return jsonify({
                'error': f'Repository error: {str(e)}'
            }), http.HTTPStatus.INTERNAL_SERVER_ERROR

    except Exception as e:
        logger.error(f"Server error: {str(e)}", exc_info=True)
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), http.HTTPStatus.INTERNAL_SERVER_ERROR

@api.route('/fetch-content', methods=['GET'])
def fetch_content():
    """Fetch content from a file in GitHub repository"""
    try:
        logger.info("Received fetch-content request")
        
        # Hardcoded repository information
        owner = "riddhishmahajan6822"
        repo_name = "Backup"
        branch = "main"
        file_name = "backup.md"

        try:
            # Initialize GitHub with token from environment
            g = Github(
                base_url=GITHUB_API,
                login_or_token=GITHUB_TOKEN,
                timeout=REQUEST_TIMEOUT
            )
            
            # Get the repository
            repo = g.get_repo(f"{owner}/{repo_name}")
            
            # Get the file content
            file_content = repo.get_contents(file_name, ref=branch)
            
            return jsonify({
                'content': file_content.decoded_content.decode('utf-8')
            })

        except GithubException as e:
            if e.status == 404:
                error_msg = f'File {file_name} not found in repository'
                logger.error(error_msg)
                return jsonify({'error': error_msg}), http.HTTPStatus.NOT_FOUND
            logger.error(f"GitHub API error: {str(e)}")
            return jsonify({'error': f'GitHub API error: {str(e)}'}), e.status

    except Exception as e:
        logger.error(f"Server error: {str(e)}", exc_info=True)
        return jsonify({'error': f'Server error: {str(e)}'}), http.HTTPStatus.INTERNAL_SERVER_ERROR

@api.route('/update-version', methods=['POST'])
def update_version():
    """Update the version in __init__.py file"""
    try:
        logger.info("Received update-version request")
        data = request.json
        
        if not data:
            error_msg = 'No JSON data provided'
            logger.error(error_msg)
            return jsonify({'error': error_msg}), http.HTTPStatus.BAD_REQUEST

        required_fields = ['owner', 'repo', 'branch', 'version', 'commitMessage']
        
        # Validate required fields
        if not all(field in data for field in required_fields):
            missing_fields = [field for field in required_fields if field not in data]
            error_msg = f'Missing required fields: {", ".join(missing_fields)}'
            logger.error(f"Validation error: {error_msg}")
            return jsonify({
                'error': error_msg
            }), http.HTTPStatus.BAD_REQUEST

        # Extract and sanitize data
        repo_owner = data['owner'].strip()
        repo_name = data['repo'].strip()
        branch_name = data['branch'].strip()
        new_version = data['version'].strip()
        commit_message = data['commitMessage'].strip()

        # Initialize GitHub client
        g = Github(
            base_url=GITHUB_API,
            login_or_token=GITHUB_TOKEN,
            timeout=REQUEST_TIMEOUT
        )

        try:
            # Get the repository
            repo = g.get_repo(f"{repo_owner}/{repo_name}")
            
            # Use the hardcoded path for __init__.py
            file_path = 'auditree-central/__init__.py'
            try:
                # First try with auditree-central path
                file = repo.get_contents(file_path, ref=branch_name)
            except GithubException:
                # If that fails, try with auditree_central path
                file_path = 'auditree_central/__init__.py'
                file = repo.get_contents(file_path, ref=branch_name)
            
            # Read current content
            current_content = file.decoded_content.decode('utf-8')
            
            # Find docstring position if it exists
            docstring_end = current_content.find('"""', current_content.find('"""') + 3) if '"""' in current_content else -1
            
            # Remove all version declarations
            cleaned_content = re.sub(r"__version__\s*=\s*['\"]([^'\"]+)['\"]", "", current_content)
            
            # Determine where to insert the version
            if docstring_end != -1:
                # Find position after docstring
                insert_position = docstring_end + 3
                while insert_position < len(cleaned_content) and cleaned_content[insert_position] in ['\n', '\r', ' ', '\t']:
                    insert_position += 1
                
                # Insert version after docstring with proper spacing
                new_content = cleaned_content[:insert_position] + f"\n\n__version__ = '{new_version}'" + cleaned_content[insert_position:]
            else:
                # No docstring found, add at beginning
                new_content = f"__version__ = '{new_version}'\n\n" + cleaned_content
            
            # Clean up any excessive newlines
            new_content = re.sub(r'\n{3,}', '\n\n', new_content)
            
            # Update the file
            result = repo.update_file(
                path=file_path,
                message=commit_message,
                content=new_content,
                sha=file.sha,
                branch=branch_name
            )

            logger.info(f"Successfully updated version to {new_version}")
            return jsonify({
                'message': 'Version updated successfully',
                'status': 'success',
                'commit': {
                    'sha': result['commit'].sha,
                    'html_url': result['commit'].html_url
                }
            })

        except GithubException as e:
            error_msg = f'GitHub API error: {str(e)}'
            logger.error(error_msg)
            return jsonify({'error': error_msg}), e.status

    except Exception as e:
        error_msg = f'Server error: {str(e)}'
        logger.error(error_msg, exc_info=True)
        return jsonify({'error': error_msg}), http.HTTPStatus.INTERNAL_SERVER_ERROR


@api.route('/create-pull-request', methods=['POST'])
def create_pull_request():
    """Create a pull request with changes to CHANGES.md and __init__.py files"""
    try:
        logger.info("Received create-pull-request request")
        data = request.json
        
        if not data:
            error_msg = 'No JSON data provided'
            logger.error(error_msg)
            return jsonify({'error': error_msg}), http.HTTPStatus.BAD_REQUEST

        required_fields = ['owner', 'repo', 'branch', 'content', 'prTitle', 'prBody', 'milestone']
        
        # Validate required fields
        if not all(field in data for field in required_fields):
            missing_fields = [field for field in required_fields if field not in data]
            error_msg = f'Missing required fields: {", ".join(missing_fields)}'
            logger.error(f"Validation error: {error_msg}")
            return jsonify({'error': error_msg}), http.HTTPStatus.BAD_REQUEST

        # Extract and sanitize data
        repo_owner = data['owner'].strip()
        repo_name = data['repo'].strip()
        base_branch = data['branch'].strip()
        new_content = data['content'].strip()
        new_version = data.get('version', '').strip()  # Make version optional
        pr_title = data['prTitle'].strip()
        pr_body = data['prBody'].strip()
        milestone = data['milestone'].strip()

        # Initialize GitHub client
        g = Github(
            base_url=GITHUB_API,
            login_or_token=GITHUB_TOKEN,
            timeout=REQUEST_TIMEOUT
        )

        try:
            # Get the repository
            repo = g.get_repo(f"{repo_owner}/{repo_name}")
            
            # Create a new branch for the PR using milestone instead of timestamp
            # Sanitize milestone for branch name (remove spaces and special characters)
            sanitized_milestone = ''.join(c if c.isalnum() else '-' for c in milestone)
            new_branch_name = f"update-changelog-{sanitized_milestone}"
            
            # Check if branch already exists, if so, add timestamp for uniqueness
            try:
                repo.get_branch(new_branch_name)
                # Branch exists, add timestamp to make it unique
                timestamp = int(time.time())
                new_branch_name = f"update-changelog-{sanitized_milestone}-{timestamp}"
                logger.info(f"Branch already exists, using unique name: {new_branch_name}")
            except GithubException as e:
                if e.status != 404:  # Error other than "not found"
                    raise e
                # If 404, branch doesn't exist which is what we want
                pass
            
            # Get the reference to the base branch
            base_ref = repo.get_git_ref(f"heads/{base_branch}")
            base_sha = base_ref.object.sha
            
            # Create new branch
            repo.create_git_ref(f"refs/heads/{new_branch_name}", base_sha)
            logger.info(f"Created new branch: {new_branch_name}")
            
            # Update CHANGES.md in the new branch
            try:
                # Try to get the existing file
                changes_file = repo.get_contents("CHANGES.md", ref=new_branch_name)
                existing_content = changes_file.decoded_content.decode('utf-8')
                
                # Ensure new_content is properly formatted
                new_content = new_content.strip()
                
                # Log content lengths for debugging
                logger.info(f"New content length: {len(new_content)}")
                logger.info(f"Existing content length: {len(existing_content)}")
                
                # Prepend new content to existing content with proper spacing
                updated_content = f"{new_content}\n\n{existing_content}"
                
                # Update existing file
                repo.update_file(
                    path="CHANGES.md",
                    message="Update CHANGES.md",
                    content=updated_content,
                    sha=changes_file.sha,
                    branch=new_branch_name
                )
                logger.info("Updated CHANGES.md file with prepended content")
            except GithubException as e:
                if e.status == 404:  # File not found
                    # Create new file with just the new content
                    repo.create_file(
                        path="CHANGES.md",
                        message="Create CHANGES.md",
                        content=new_content,
                        branch=new_branch_name
                    )
                    logger.info("Created CHANGES.md file")
                else:
                    raise e
            
            # Update __init__.py in the new branch if version is provided
            if new_version:
                try:
                    # Try different possible paths for __init__.py
                    possible_paths = [
                        'auditree-central/__init__.py',
                        'auditree_central/__init__.py',
                        '__init__.py'
                    ]
                    
                    init_file = None
                    file_path = None
                    
                    # Try each path until we find the file
                    for path in possible_paths:
                        try:
                            init_file = repo.get_contents(path, ref=new_branch_name)
                            file_path = path
                            break
                        except GithubException:
                            continue
                    
                    if init_file and file_path:
                        # Read current content
                        current_content = init_file.decoded_content.decode('utf-8')
                        
                        # Find docstring position if it exists
                        docstring_end = current_content.find('"""', current_content.find('"""') + 3) if '"""' in current_content else -1
                        
                        # Remove all version declarations
                        cleaned_content = re.sub(r"__version__\s*=\s*['\"]([^'\"]+)['\"]", "", current_content)
                        
                        # Determine where to insert the version
                        if docstring_end != -1:
                            # Find position after docstring
                            insert_position = docstring_end + 3
                            while insert_position < len(cleaned_content) and cleaned_content[insert_position] in ['\n', '\r', ' ', '\t']:
                                insert_position += 1
                            
                            # Insert version after docstring with proper spacing
                            new_content_init = cleaned_content[:insert_position] + f"\n\n__version__ = '{new_version}'" + cleaned_content[insert_position:]
                        else:
                            # No docstring found, add at beginning
                            new_content_init = f"__version__ = '{new_version}'\n\n" + cleaned_content
                        
                        # Clean up any excessive newlines
                        new_content_init = re.sub(r'\n{3,}', '\n\n', new_content_init)
                        
                        # Update the file
                        repo.update_file(
                            path=file_path,
                            message=f"Update version to {new_version}",
                            content=new_content_init,
                            sha=init_file.sha,
                            branch=new_branch_name
                        )
                        logger.info(f"Updated version to {new_version} in {file_path}")
                    else:
                        logger.warning("Could not find __init__.py file in any of the expected locations")
                except GithubException as e:
                    logger.error(f"Error updating __init__.py: {str(e)}")
                    # Continue with PR creation even if version update fails
            
            # Create the pull request
            pr = repo.create_pull(
                title=pr_title,
                body=pr_body,
                head=new_branch_name,
                base=base_branch
            )
            
            logger.info(f"Successfully created pull request #{pr.number}")
            return jsonify({
                'message': 'Pull request created successfully',
                'status': 'success',
                'pull_request': {
                    'number': pr.number,
                    'html_url': pr.html_url,
                    'title': pr.title
                }
            })

        except GithubException as e:
            error_msg = f'GitHub API error: {str(e)}'
            logger.error(error_msg)
            return jsonify({'error': error_msg}), e.status

    except Exception as e:
        error_msg = f'Server error: {str(e)}'
        logger.error(error_msg, exc_info=True)
        return jsonify({'error': error_msg}), http.HTTPStatus.INTERNAL_SERVER_ERROR

@api.route('/create-gist-link', methods=['POST'])
def create_gist_link():
    """Create a GitHub Gist and return its URL"""
    try:
        logger.info("Received create-gist-link request")
        data = request.json
        if not data or 'content' not in data:
            error_msg = 'Missing content in request'
            logger.error(error_msg)
            return jsonify({'error': error_msg}), http.HTTPStatus.BAD_REQUEST

        content = data['content'].strip()

        try:
            # Initialize GitHub client
            g = Github(
                base_url=GITHUB_API,
                login_or_token=GITHUB_TOKEN, # Use your standard GITHUB_TOKEN
                timeout=REQUEST_TIMEOUT
            )
            user = g.get_user() # Authenticate to ensure token is valid

            # Create a new Gist
            try:
                gist = user.create_gist(
                    public=False,  # Make the Gist public for sharing
                    description="Shared Changelog from Release Note Manager",
                    files={
                        "changes.md": InputFileContent(content)
                    }
                )
            except GithubException as gist_error:
                if gist_error.status == 403:
                    error_msg = 'Permission denied: Your GitHub token may not have permission to create Gists'
                    logger.error(f"{error_msg}: {str(gist_error)}")
                    return jsonify({'error': error_msg}), http.HTTPStatus.FORBIDDEN
                else:
                    raise gist_error

            logger.info(f"Gist created successfully: {gist.html_url}")
            return jsonify({
                'gist_url': gist.html_url,
                'message': 'Gist link created successfully',
                'status': 'success'
            }), http.HTTPStatus.CREATED

        except GithubException as e:
            error_msg = f'GitHub API error during Gist creation: {str(e)}'
            logger.error(error_msg)
            return jsonify({'error': error_msg}), e.status
        except Exception as e:
            error_msg = f'Error creating Gist: {str(e)}'
            logger.error(error_msg, exc_info=True)
            return jsonify({'error': error_msg}), http.HTTPStatus.INTERNAL_SERVER_ERROR

    except Exception as e:
        logger.error(f"Server error in create_gist_link: {str(e)}", exc_info=True)
        return jsonify({'error': f'Server error: {str(e)}'}), http.HTTPStatus.INTERNAL_SERVER_ERROR

@api.route('/fetch-gist', methods=['GET'])
def fetch_gist():
    """Fetch content from a GitHub Gist"""
    try:
        logger.info("Received fetch-gist request")
        gist_id = request.args.get('gist_id')
        is_enterprise = request.args.get('is_enterprise', 'false').lower() == 'true'
        
        if not gist_id:
            error_msg = 'Missing gist_id parameter'
            logger.error(error_msg)
            return jsonify({'error': error_msg}), http.HTTPStatus.BAD_REQUEST

        try:
            # Initialize GitHub with token from environment
            # Use the appropriate API base URL based on the is_enterprise flag
            api_base_url = GITHUB_API
            if is_enterprise and not api_base_url.endswith('api.github.com'):
                # If we're using enterprise GitHub, make sure we're using the right API URL
                # The GITHUB_API in config should already be set to the enterprise API URL
                pass
            elif is_enterprise and api_base_url.endswith('api.github.com'):
                # If config is set to public GitHub but we need enterprise
                api_base_url = "https://api.github.ibm.com"
                logger.info(f"Switching to enterprise GitHub API: {api_base_url}")
                
            logger.info(f"Using GitHub API URL: {api_base_url}")
            g = Github(
                base_url=api_base_url,
                login_or_token=GITHUB_TOKEN,
                timeout=REQUEST_TIMEOUT
            )
            
            # Try to get the user to verify authentication
            try:
                user = g.get_user()
                logger.info(f"Authenticated as: {user.login}")
            except GithubException as e:
                error_msg = f'Authentication failed: {str(e)}. Please check your GitHub token.'
                logger.error(error_msg)
                return jsonify({'error': error_msg}), http.HTTPStatus.UNAUTHORIZED

            # Try to get the Gist
            try:
                logger.info(f"Trying to access Gist: {gist_id}")
                gist = g.get_gist(gist_id)
                
                # Get all files in the Gist
                files = gist.files
                
                # Find the first Markdown file
                markdown_content = None
                markdown_filename = None
                
                for filename, gist_file in files.items():
                    if filename.endswith('.md') or gist_file.language == 'Markdown':
                        markdown_content = gist_file.content
                        markdown_filename = filename
                        break
                
                if markdown_content:
                    logger.info(f"Successfully fetched Markdown file '{markdown_filename}' from Gist")
                    return jsonify({
                        'content': markdown_content,
                        'filename': markdown_filename
                    })
                else:
                    error_msg = 'No Markdown file found in the Gist'
                    logger.error(error_msg)
                    return jsonify({'error': error_msg}), http.HTTPStatus.NOT_FOUND
                
            except GithubException as e:
                if e.status == 404:
                    error_msg = f'Gist {gist_id} not found'
                    logger.error(error_msg)
                    return jsonify({'error': error_msg}), http.HTTPStatus.NOT_FOUND
                logger.error(f"GitHub API error: {str(e)}")
                return jsonify({'error': f'GitHub API error: {str(e)}'}), e.status

        except GithubException as e:
            error_msg = f'GitHub API error: {str(e)}'
            logger.error(error_msg)
            return jsonify({'error': error_msg}), e.status
        except Exception as e:
            error_msg = f'Error fetching Gist: {str(e)}'
            logger.error(error_msg, exc_info=True)
            return jsonify({'error': error_msg}), http.HTTPStatus.INTERNAL_SERVER_ERROR

    except Exception as e:
        error_msg = f'Server error: {str(e)}'
        logger.error(error_msg, exc_info=True)
        return jsonify({'error': error_msg}), http.HTTPStatus.INTERNAL_SERVER_ERROR

