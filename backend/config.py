import os
from dotenv import load_dotenv
import logging
import sys
from logging.handlers import RotatingFileHandler

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

# Environment Configuration
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO' if ENVIRONMENT == 'production' else 'DEBUG')

def setup_logging():
    """Configure logging with proper formatting and handlers"""
    # Create logger
    logger = logging.getLogger('changes_app')
    logger.setLevel(getattr(logging, LOG_LEVEL.upper()))
    
    # Prevent duplicate logs
    if logger.handlers:
        return logger
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, LOG_LEVEL.upper()))
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler - create logs directory if it doesn't exist
    logs_dir = 'logs'
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir)
    
    log_file = os.getenv('LOG_FILE', os.path.join(logs_dir, 'app.log'))
    file_handler = RotatingFileHandler(
        log_file, 
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Set third-party loggers to WARNING to reduce noise
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('requests').setLevel(logging.WARNING)
    logging.getLogger('github').setLevel(logging.WARNING)
    
    return logger

# Initialize logger
logger = setup_logging()

def github_headers():
    return {
        'Authorization': f'token {GITHUB_TOKEN}', 
        'Accept': 'application/vnd.github.v3+json'
    } 
    
