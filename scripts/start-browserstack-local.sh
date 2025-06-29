#!/bin/bash

# BrowserStack Local Binary Setup Script
# This script downloads and starts BrowserStack Local binary

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if credentials are set
if [ -z "$BROWSERSTACK_USERNAME" ] || [ -z "$BROWSERSTACK_ACCESS_KEY" ]; then
    echo -e "${RED}❌ BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY must be set${NC}"
    echo ""
    echo "Set them in your environment:"
    echo "export BROWSERSTACK_USERNAME=\"your_username\""
    echo "export BROWSERSTACK_ACCESS_KEY=\"your_access_key\""
    exit 1
fi

# Set local identifier (use timestamp if not provided)
LOCAL_IDENTIFIER=${BROWSERSTACK_LOCAL_IDENTIFIER:-"local-$(date +%s)"}

echo -e "${GREEN}🚀 Setting up BrowserStack Local tunnel...${NC}"
echo "Username: $BROWSERSTACK_USERNAME"
echo "Local Identifier: $LOCAL_IDENTIFIER"
echo ""

# Determine OS and download appropriate binary
OS=$(uname -s)
ARCH=$(uname -m)

if [[ "$OS" == "Darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        BINARY_URL="https://www.browserstack.com/browserstack-local/BrowserStackLocal-darwin-arm64.zip"
    else
        BINARY_URL="https://www.browserstack.com/browserstack-local/BrowserStackLocal-darwin-x64.zip"
    fi
elif [[ "$OS" == "Linux" ]]; then
    BINARY_URL="https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip"
else
    echo -e "${RED}❌ Unsupported OS: $OS${NC}"
    exit 1
fi

echo -e "${YELLOW}📥 Downloading BrowserStack Local binary for $OS $ARCH...${NC}"

# Download the binary
curl -L -o BrowserStackLocal.zip "$BINARY_URL"

# Unzip the binary
unzip -o BrowserStackLocal.zip

# Make it executable
chmod +x BrowserStackLocal

# Clean up zip file
rm BrowserStackLocal.zip

echo -e "${GREEN}✅ BrowserStack Local binary downloaded and ready${NC}"
echo ""

# Start the tunnel
echo -e "${YELLOW}🚀 Starting BrowserStack Local tunnel...${NC}"
echo "Command: ./BrowserStackLocal --key $BROWSERSTACK_ACCESS_KEY --local-identifier $LOCAL_IDENTIFIER --verbose --force-local"
echo ""

# Start the tunnel in the background
./BrowserStackLocal --key "$BROWSERSTACK_ACCESS_KEY" --local-identifier "$LOCAL_IDENTIFIER" --verbose --force-local &
TUNNEL_PID=$!

# Store PID for cleanup
echo $TUNNEL_PID > browserstack-local.pid

echo -e "${GREEN}✅ BrowserStack Local tunnel started (PID: $TUNNEL_PID)${NC}"
echo ""
echo -e "${YELLOW}⏳ Waiting for tunnel to be ready...${NC}"

# Wait for tunnel to be established
sleep 30

# Check if process is still running
if ps -p $TUNNEL_PID > /dev/null; then
    echo -e "${GREEN}✅ BrowserStack Local tunnel is running and ready!${NC}"
    echo ""
    echo -e "${GREEN}🔗 Your fixture server should now be accessible at:${NC}"
    echo "   http://localhost:12345/state.json"
    echo ""
    echo -e "${YELLOW}💡 To stop the tunnel, run:${NC}"
    echo "   kill $TUNNEL_PID"
    echo "   or"
    echo "   ./scripts/stop-browserstack-local.sh"
    echo ""
    echo -e "${YELLOW}📝 To test the connection:${NC}"
    echo "   curl http://localhost:12345/state.json"
else
    echo -e "${RED}❌ BrowserStack Local tunnel failed to start${NC}"
    exit 1
fi 