/**
 * BrowserStack Local Tunnel Setup Utility
 * This script helps set up and verify BrowserStack Local tunnel for fixture server access
 */

const BrowserStackLocal = require('browserstack-local');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class BrowserStackLocalSetup {
  constructor() {
    this.bsLocal = new BrowserStackLocal.Local();
    this.username = process.env.BROWSERSTACK_USERNAME;
    this.accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
    this.localIdentifier = process.env.BROWSERSTACK_LOCAL_IDENTIFIER || process.env.GITHUB_RUN_ID || 'local-tunnel';
  }

  /**
   * Start BrowserStack Local tunnel
   */
  async startTunnel() {
    if (!this.username || !this.accessKey) {
      throw new Error('BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables are required');
    }

    const options = {
      key: this.accessKey,
      localIdentifier: this.localIdentifier,
      forceLocal: true,
      verbose: true,
      // Enable all ports that might be needed
      force: true,
      // Additional options for better connectivity
      binarypath: null, // Use default binary
      logFile: path.join(__dirname, '../reports/browserstack-local.log'),
    };

    console.log('🚀 Starting BrowserStack Local tunnel...');
    console.log('Options:', JSON.stringify(options, null, 2));

    return new Promise((resolve, reject) => {
      this.bsLocal.start(options, (error) => {
        if (error) {
          console.error('❌ Failed to start BrowserStack Local tunnel:', error);
          reject(error);
          return;
        }

        console.log('✅ BrowserStack Local tunnel started successfully');
        console.log('Local Identifier:', this.localIdentifier);
        resolve();
      });
    });
  }

  /**
   * Stop BrowserStack Local tunnel
   */
  async stopTunnel() {
    if (!this.bsLocal.isRunning()) {
      console.log('ℹ️ BrowserStack Local tunnel is not running');
      return;
    }

    console.log('🛑 Stopping BrowserStack Local tunnel...');
    
    return new Promise((resolve, reject) => {
      this.bsLocal.stop((error) => {
        if (error) {
          console.error('❌ Failed to stop BrowserStack Local tunnel:', error);
          reject(error);
          return;
        }

        console.log('✅ BrowserStack Local tunnel stopped successfully');
        resolve();
      });
    });
  }

  /**
   * Check if tunnel is running
   */
  isRunning() {
    return this.bsLocal.isRunning();
  }

  /**
   * Verify fixture server accessibility through tunnel
   */
  async verifyFixtureServer() {
    const fixtureServerUrl = 'http://localhost:12345/state.json';
    
    console.log('🔍 Verifying fixture server accessibility...');
    console.log('Fixture server URL:', fixtureServerUrl);

    try {
      const response = await axios.get(fixtureServerUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'BrowserStack-Local-Verification'
        }
      });

      if (response.status === 200) {
        console.log('✅ Fixture server is accessible via BrowserStack tunnel');
        console.log('Response status:', response.status);
        console.log('Response data preview:', JSON.stringify(response.data).substring(0, 200) + '...');
        return true;
      } else {
        console.log('⚠️ Fixture server responded with unexpected status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Fixture server is not accessible:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 This might mean:');
        console.log('   1. Fixture server is not running on localhost:12345');
        console.log('   2. BrowserStack Local tunnel is not properly configured');
        console.log('   3. Firewall is blocking the connection');
      }
      
      return false;
    }
  }

  /**
   * Test tunnel connectivity with a simple HTTP request
   */
  async testTunnelConnectivity() {
    console.log('🔍 Testing tunnel connectivity...');
    
    try {
      // Test with a simple HTTP request to a known endpoint
      const response = await axios.get('http://localhost:8080', {
        timeout: 5000,
        validateStatus: () => true // Don't throw on any status code
      });
      
      console.log('✅ Tunnel connectivity test successful');
      console.log('Response status:', response.status);
      return true;
    } catch (error) {
      console.error('❌ Tunnel connectivity test failed:', error.message);
      return false;
    }
  }

  /**
   * Get tunnel status and information
   */
  getTunnelInfo() {
    return {
      isRunning: this.bsLocal.isRunning(),
      localIdentifier: this.localIdentifier,
      username: this.username,
      accessKey: this.accessKey ? `${this.accessKey.substring(0, 8)}...` : 'NOT SET'
    };
  }

  /**
   * Wait for tunnel to be ready
   */
  async waitForTunnelReady(maxWaitTime = 60000) {
    console.log('⏳ Waiting for BrowserStack Local tunnel to be ready...');
    
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds
    
    while (Date.now() - startTime < maxWaitTime) {
      if (this.bsLocal.isRunning()) {
        console.log('✅ BrowserStack Local tunnel is ready');
        return true;
      }
      
      console.log('⏳ Tunnel not ready yet, waiting...');
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    throw new Error(`BrowserStack Local tunnel did not become ready within ${maxWaitTime}ms`);
  }
}

// CLI usage
if (require.main === module) {
  const setup = new BrowserStackLocalSetup();
  
  const command = process.argv[2];
  
  async function main() {
    try {
      switch (command) {
        case 'start':
          await setup.startTunnel();
          await setup.waitForTunnelReady();
          await setup.verifyFixtureServer();
          break;
          
        case 'stop':
          await setup.stopTunnel();
          break;
          
        case 'status':
          console.log('Tunnel Status:', setup.getTunnelInfo());
          break;
          
        case 'verify':
          await setup.verifyFixtureServer();
          break;
          
        case 'test':
          await setup.testTunnelConnectivity();
          break;
          
        default:
          console.log('Usage: node browserstackLocalSetup.js [start|stop|status|verify|test]');
          console.log('');
          console.log('Commands:');
          console.log('  start   - Start BrowserStack Local tunnel');
          console.log('  stop    - Stop BrowserStack Local tunnel');
          console.log('  status  - Show tunnel status');
          console.log('  verify  - Verify fixture server accessibility');
          console.log('  test    - Test tunnel connectivity');
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
  
  main();
}

module.exports = BrowserStackLocalSetup; 