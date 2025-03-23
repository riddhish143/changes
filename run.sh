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
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

# Function to print info messages
print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
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

print_header "Starting Process"

# Execute your original script commands here, wrapped with visual indicators
# For example:
print_info "Starting services..."
# Your command here
print_success "Services started successfully!"

# Colors for better visibility
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting services...${NC}"

# Start backend
echo -e "${BLUE}Starting Backend Server...${NC}"
cd backend
source venv/bin/activate
python3 app.py &

# Start frontend
echo -e "${BLUE}Starting Frontend Server...${NC}"
cd ../frontend
npm run dev &

# Wait for all background processes
wait

echo -e "\n${BLUE}===============================================${NC}"
echo -e "${BLUE}          Script Execution Completed          ${NC}"
echo -e "${BLUE}===============================================${NC}"