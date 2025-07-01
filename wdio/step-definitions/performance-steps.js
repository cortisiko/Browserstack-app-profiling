const { Given, When, Then } = require('@wdio/cucumber-framework');
const BrowserStackAPI = require('../utils/browserstackApi');

/**
 * Performance testing steps for BrowserStack app profiling
 */

Given('I capture the current BrowserStack session ID', async function() {
  try {
    const sessionCapabilities = await browser.getAppiumSessionCapabilities();
    const deviceUDID = sessionCapabilities.sessionId;
    
    // Try to extract BrowserStack session ID from various sources
    let browserstackSessionId = null;
    
    // Method 1: Check if it's in the capabilities
    if (sessionCapabilities['bstack:options']?.sessionId) {
      browserstackSessionId = sessionCapabilities['bstack:options'].sessionId;
      console.log('Found BrowserStack session ID in capabilities:', browserstackSessionId);
    }
    
    // Method 2: Check environment variables
    if (!browserstackSessionId && process.env.BROWSERSTACK_SESSION_ID) {
      browserstackSessionId = process.env.BROWSERSTACK_SESSION_ID;
      console.log('Found BrowserStack session ID in environment:', browserstackSessionId);
    }
    
    // Method 3: Use device UDID as fallback
    if (!browserstackSessionId) {
      browserstackSessionId = deviceUDID;
      console.log('Using device UDID as BrowserStack session ID:', browserstackSessionId);
    }
    
    // Store the session ID globally
    global.currentBrowserStackSessionId = browserstackSessionId;
    
    console.log('=== BROWSERSTACK SESSION ID CAPTURED ===');
    console.log('Session ID:', browserstackSessionId);
    console.log('Device UDID:', deviceUDID);
    console.log('Build ID:', sessionCapabilities['bstack:options']?.buildIdentifier || 
                sessionCapabilities.build || sessionCapabilities['appium:build']);
    
    // Capture the session ID for later use
    const api = new BrowserStackAPI();
    api.captureCurrentSessionId(browserstackSessionId);
    
    console.log('✓ Session ID captured and stored for profiling data collection');
    
  } catch (error) {
    console.error('Error capturing BrowserStack session ID:', error);
    throw error;
  }
});

When('I collect app profiling data for the current session', async function() {
  try {
    const api = new BrowserStackAPI();
    const profilingData = await api.getCurrentSessionProfilingData();
    
    if (profilingData) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `manual-profiling-${timestamp}.json`;
      api.saveProfilingData(profilingData, filename);
      
      console.log(`Manual profiling data saved: ${filename}`);
      
      // Store in scenario context for verification
      this.profilingData = profilingData;
    } else {
      console.log('No profiling data available for current session');
    }
  } catch (error) {
    console.error('Error collecting profiling data:', error);
  }
});

Then('the app profiling data should show CPU usage below {int}%', function(maxCpuUsage) {
  if (!this.profilingData) {
    throw new Error('No profiling data available for verification');
  }
  
  const appData = this.profilingData.data['io.metamask.qa'];
  if (!appData || !appData.metrics || !appData.metrics.cpu) {
    throw new Error('CPU metrics not found in profiling data');
  }
  
  const avgCpu = appData.metrics.cpu.avg;
  console.log(`Average CPU usage: ${avgCpu}%`);
  
  if (avgCpu > maxCpuUsage) {
    throw new Error(`CPU usage ${avgCpu}% exceeds threshold of ${maxCpuUsage}%`);
  }
});

Then('the app profiling data should show memory usage below {int}MB', function(maxMemoryUsage) {
  if (!this.profilingData) {
    throw new Error('No profiling data available for verification');
  }
  
  const appData = this.profilingData.data['io.metamask.qa'];
  if (!appData || !appData.metrics || !appData.metrics.mem) {
    throw new Error('Memory metrics not found in profiling data');
  }
  
  const avgMemory = appData.metrics.mem.avg;
  console.log(`Average memory usage: ${avgMemory}MB`);
  
  if (avgMemory > maxMemoryUsage) {
    throw new Error(`Memory usage ${avgMemory}MB exceeds threshold of ${maxMemoryUsage}MB`);
  }
});

Then('the app profiling data should be available', function() {
  if (!this.profilingData) {
    throw new Error('No profiling data available');
  }
  
  console.log('Profiling data is available with the following metrics:');
  const appData = this.profilingData.data['io.metamask.qa'];
  if (appData && appData.metrics) {
    Object.keys(appData.metrics).forEach(metric => {
      console.log(`- ${metric}: ${JSON.stringify(appData.metrics[metric])}`);
    });
  }
});

Then('I collect app profiling data at test end', async function() {
  try {
    console.log('Collecting app profiling data at test end...');
    const api = new BrowserStackAPI();
    const profilingData = await api.getCurrentSessionProfilingData();
    
    if (profilingData) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `test-end-profiling-${timestamp}.json`;
      api.saveProfilingData(profilingData, filename);
      
      console.log(`Test end profiling data saved: ${filename}`);
      
      // Store in scenario context for verification
      this.profilingData = profilingData;
    } else {
      console.log('No profiling data available at test end');
    }
  } catch (error) {
    console.error('Error collecting profiling data at test end:', error);
  }
});

Then('I output the current BrowserStack session ID', async function() {
  const sessionId = global.currentBrowserStackSessionId || 'Not captured';
  console.log('=== CURRENT BROWSERSTACK SESSION ID ===');
  console.log('Session ID:', sessionId);
  console.log('=====================================');
}); 