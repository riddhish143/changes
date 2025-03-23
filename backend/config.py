import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# GitHub Configuration
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_BACKUP_TOKEN = os.getenv('GITHUB_BACKUP_TOKEN')
GITHUB_API = "https://github.ibm.com/api/v3"
VERSION_INIT_FILE_URL = "https://raw.github.ibm.com/auditree/auditree-central/master/auditree_central/__init__.py"
# API Configuration
PER_PAGE = 100
REQUEST_TIMEOUT = 30

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def github_headers():
    return {
        'Authorization': f'token {GITHUB_TOKEN}', 
        'Accept': 'application/vnd.github.v3+json'
    } 
    
