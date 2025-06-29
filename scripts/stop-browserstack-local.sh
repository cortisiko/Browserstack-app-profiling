#!/bin/bash

# BrowserStack Local Stop Script
# This script stops the BrowserStack Local binary

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping BrowserStack Local tunnel...${NC}"

# Check if PID file exists and stop the process
if [ -f browserstack-local.pid ]; then
    PID=$(cat browserstack-local.pid)
    echo "Found BrowserStack Local process (PID: $PID)"
    
    # Try to stop gracefully first
    if kill -TERM $PID 2>/dev/null; then
        echo -e "${YELLOW}Sent TERM signal to BrowserStack Local${NC}"
        
        # Wait for graceful shutdown
        sleep 5
        
        # Force kill if still running
        if ps -p $PID > /dev/null; then
            echo -e "${YELLOW}Force killing BrowserStack Local process${NC}"
            kill -KILL $PID 2>/dev/null
        fi
    else
        echo -e "${YELLOW}Process $PID not found or already stopped${NC}"
    fi
    
    # Clean up PID file
    rm -f browserstack-local.pid
    echo -e "${GREEN}✅ Removed PID file${NC}"
else
    echo -e "${YELLOW}No PID file found${NC}"
fi

# Also try to kill any remaining BrowserStackLocal processes
echo -e "${YELLOW}Checking for any remaining BrowserStackLocal processes...${NC}"
if pkill -f BrowserStackLocal 2>/dev/null; then
    echo -e "${GREEN}✅ Killed remaining BrowserStackLocal processes${NC}"
else
    echo -e "${YELLOW}No remaining BrowserStackLocal processes found${NC}"
fi

# Clean up binary if it exists
if [ -f BrowserStackLocal ]; then
    echo -e "${YELLOW}Removing BrowserStackLocal binary...${NC}"
    rm -f BrowserStackLocal
    echo -e "${GREEN}✅ Removed BrowserStackLocal binary${NC}"
fi

echo -e "${GREEN}✅ BrowserStack Local tunnel cleanup completed${NC}" 