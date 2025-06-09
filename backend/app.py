from flask import Flask
from flask_cors import CORS
from routes import api
from config import logger, ENVIRONMENT
import os

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Configure CORS to allow requests from your Vercel frontend
    CORS(app, resources={r"/api/*": {"origins": "https://changes-five.vercel.app"}})
    
    # Register blueprints
    app.register_blueprint(api, url_prefix='/api')
    
    # Log application startup
    logger.info(f"Flask application created successfully in {ENVIRONMENT} environment")
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    debug_mode = ENVIRONMENT != 'production'
    
    logger.info(f"Starting Flask application on host=0.0.0.0, port={port}, debug={debug_mode}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
