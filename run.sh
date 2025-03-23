#!/bin/bash

# Define colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored section headers
print_header() {
  echo -e "\n${BLUE}===================================================${NC}"
  echo -e "${BLUE}   $1${NC}"
  echo -e "${BLUE}===================================================${NC}\n"
}

# Function to print success messages
print_success() {
  echo -e "${GREEN}\u2713 $1${NC}"
}

# Function to print error messages
print_error() {
  echo -e "${RED}\u2717 $1${NC}"
  exit 1
}

# Function to print info messages
print_info() {
  echo -e "${YELLOW}\u2139 $1${NC}"
}

# Function to handle cleanup when script is terminated
cleanup() {
    echo "Shutting down services..."
    kill $(jobs -p)
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Main execution
clear
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}          Script Execution Started            ${NC}"
echo -e "${BLUE}===============================================${NC}"

print_header "Starting Deployment Process"

# Starting services
print_info "Setting up backend environment..."
cd backend || print_error "Failed to change directory to backend"
python3 -m venv venv || print_error "Failed to create virtual environment"
source venv/bin/activate || print_error "Failed to activate virtual environment"
pip install -r requirements.txt || print_error "Failed to install backend dependencies"
print_success "Backend environment setup completed!"

print_info "Starting backend service..."
python3 app.py &
print_success "Backend service started successfully!"

print_info "Setting up frontend environment..."
cd ../frontend || print_error "Failed to change directory to frontend"
npm i || print_error "Failed to install frontend dependencies"
print_success "Frontend environment setup completed!"

print_info "Starting frontend service..."
npm run dev &
print_success "Frontend service started successfully!"

# Wait for all background processes
wait

echo -e "\n${BLUE}===============================================${NC}"
echo -e "${BLUE}          Deployment Completed                ${NC}"
echo -e "${BLUE}===============================================${NC}"
