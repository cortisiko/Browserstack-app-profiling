import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Checks if BrowserStack Local tunnel is accessible and can reach fixture server
 * Retries with backoff if tunnel is not accessible
 */
export async function ensureBrowserStackLocalAccess() {
  const maxAttempts = 3;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔍 Checking BrowserStack Local tunnel accessibility (attempt ${attempt}/${maxAttempts})...`);
      
      // Check if tunnel is running
      const isRunning = await isBrowserStackLocalRunning();
      if (!isRunning) {
        console.log('⚠️ BrowserStack Local tunnel not running, starting it...');
        await restartBrowserStackLocal();
        continue; // Try again after restart
      }
      
      // Check if tunnel can access fixture server
      console.log('🔍 Testing tunnel access to fixture server...');
      try {
        const { stdout } = await execAsync('curl -s http://localhost:12345/state.json');
        console.log('✅ Tunnel can access fixture server:');
        console.log('State preview:', stdout.substring(0, 200) + '...');
        console.log('✅ BrowserStack Local tunnel is accessible and working');
        return; // Success!
      } catch (error) {
        console.warn(`⚠️ Tunnel cannot access fixture server (attempt ${attempt}/${maxAttempts}), restarting...`);
        await restartBrowserStackLocal();
        
        if (attempt < maxAttempts) {
          console.log(`⏳ Waiting ${attempt * 5} seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 5000));
        }
      }
      
    } catch (error) {
      console.error(`❌ Error on attempt ${attempt}/${maxAttempts}:`, error);
      if (attempt === maxAttempts) {
        throw new Error(`Failed to establish BrowserStack Local tunnel access after ${maxAttempts} attempts: ${error.message}`);
      }
    }
  }
  
  // If we get here, all attempts failed
  const errorMessage = `Failed to establish BrowserStack Local tunnel access after ${maxAttempts} attempts. The app cannot connect to the fixture server, which will cause test failures.`;
  console.error('❌ CRITICAL:', errorMessage);
  throw new Error(errorMessage);
}

/**
 * Restarts BrowserStack Local tunnel after fixture server is loaded
 * This ensures the tunnel can access the fixture server with loaded state
 */
export async function restartBrowserStackLocal() {
  try {
    console.log('🔄 Restarting BrowserStack Local tunnel...');
    
    // Kill existing tunnel process
    console.log('📴 Stopping existing BrowserStack Local process...');
    try {
      await execAsync('pkill -f BrowserStackLocal');
      console.log('✅ Existing BrowserStack Local process stopped');
    } catch (error) {
      // pkill returns non-zero if no processes found, which is fine
      console.log('ℹ️ No existing BrowserStack Local process found (this is normal)');
    }
    
    // Wait for process to fully stop
    console.log('⏳ Waiting for process to stop...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we have the access key
    const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
    if (!accessKey) {
      throw new Error('BROWSERSTACK_ACCESS_KEY environment variable is required');
    }
    
    // Restart tunnel with same configuration
    console.log('🚀 Starting BrowserStack Local tunnel...');
    const command = `./BrowserStackLocal --key ${accessKey} --local-identifier ${process.env.GITHUB_RUN_ID} --force-local --verbose &`;
    
    await execAsync(command);
    
    // Wait for tunnel to be ready
    console.log('⏳ Waiting for tunnel to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify fixture server is accessible via curl
    console.log('🔍 Verifying fixture server accessibility...');
    try {
      const { stdout } = await execAsync('curl -s http://localhost:12345/state.json');
      console.log('✅ Fixture server state accessible via curl:');
      console.log('State preview:', stdout.substring(0, 200) + '...');
    } catch (error) {
      console.warn('⚠️ Could not access fixture server via curl:', error.message);
    }
    
    console.log('✅ BrowserStack Local tunnel restarted successfully');
    
  } catch (error) {
    console.error('❌ Error restarting BrowserStack Local:', error);
    throw error;
  }
}

/**
 * Checks if BrowserStack Local tunnel is running
 */
export async function isBrowserStackLocalRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('pgrep -f BrowserStackLocal');
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the BrowserStack Local tunnel status
 */
export async function getTunnelStatus() {
  try {
    const { stdout } = await execAsync('ps aux | grep BrowserStackLocal | grep -v grep');
    return stdout.trim();
  } catch (error) {
    return 'Tunnel not running';
  }
}

/**
 * Provides diagnostic information when tunnel fails
 */
export async function getTunnelDiagnostics() {
  const diagnostics = {
    tunnelRunning: await isBrowserStackLocalRunning(),
    tunnelStatus: await getTunnelStatus(),
    fixtureServerAccessible: false,
    environmentVariables: {
      BROWSERSTACK_ACCESS_KEY: !!process.env.BROWSERSTACK_ACCESS_KEY,
      GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
      BROWSERSTACK_LOCAL: process.env.BROWSERSTACK_LOCAL
    }
  };

  // Test fixture server accessibility
  try {
    await execAsync('curl -s http://localhost:12345/state.json');
    diagnostics.fixtureServerAccessible = true;
  } catch (error) {
    diagnostics.fixtureServerAccessible = false;
  }

  return diagnostics;
} 