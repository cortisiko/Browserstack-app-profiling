import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Restarts BrowserStack Local tunnel after fixture server is loaded
 * This ensures the tunnel can access the fixture server with loaded state
 */
export async function restartBrowserStackLocal() {
  try {
    console.log('Restarting BrowserStack Local tunnel...');
    
    // Kill existing tunnel process
    console.log('Stopping existing BrowserStack Local process...');
    await execAsync('pkill -f BrowserStackLocal || true');
    
    // Wait for process to fully stop
    console.log('Waiting for process to stop...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we have the access key
    const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
    if (!accessKey) {
      throw new Error('BROWSERSTACK_ACCESS_KEY environment variable is required');
    }
    
    // Restart tunnel with same configuration
    console.log('Starting BrowserStack Local tunnel...');
    const command = `./BrowserStackLocal --key ${accessKey} --local-identifier ${process.env.GITHUB_RUN_ID} --force-local --verbose &`;
    
    await execAsync(command);
    
    // Wait for tunnel to be ready
    console.log('Waiting for tunnel to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
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