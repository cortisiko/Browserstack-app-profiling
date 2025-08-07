import ADB from "appium-adb";

declare const driver: any;

/**
 * App bundle IDs for different platforms and environments
 */
const APP_BUNDLE_IDS = {
  ios: {
    browserstack: "io.metamask.MetaMask-QA",
    local: "io.metamask.MetaMask",
  },
  android: {
    browserstack: "io.metamask.qa",
    local: "io.metamask.qa"
  }
} as const;

/**
 * Interface for app launch configuration
 */
interface AppLaunchConfig {
  platform: string;
  isBrowserStack: boolean;
  setupLocalEnvironment?: boolean;
}

/**
 * Launches the MetaMask app based on platform and environment
 * @param config - Configuration object containing platform and environment info
 * @returns Promise<void>
 */
export async function launchApp(config: AppLaunchConfig): Promise<void> {
  const { platform, isBrowserStack, setupLocalEnvironment = true } = config;

  try {
    // Configure local development environment if needed
    if (setupLocalEnvironment && !isBrowserStack && platform === "Android") {
      await setupLocalAndroidEnvironment();
    }

    // Get the appropriate bundle ID
    const bundleId = getBundleId(platform, isBrowserStack);
    console.log(`Launching app with bundle ID: ${bundleId}`);
    
    // // Terminate app if it's already running to ensure clean state
    // await terminateApp(bundleId);

    // Launch the app
    await driver.activateApp(bundleId);
    console.log(`Successfully launched app: ${bundleId}`);

    // Wait a moment for app to initialize
    await driver.pause(2000);

  } catch (error) {
    console.error(`Failed to launch app: ${error}`);
    throw new Error(`App launch failed: ${error}`);
  }
}

/**
 * Gets the appropriate bundle ID for the platform and environment
 * @param platform - The platform (iOS or Android)
 * @param isBrowserStack - Whether running on BrowserStack
 * @returns The bundle ID string
 */
function getBundleId(platform: string, isBrowserStack: boolean): string {
  if (platform === "iOS") {
    return isBrowserStack 
      ? APP_BUNDLE_IDS.ios.browserstack 
      : APP_BUNDLE_IDS.ios.local;
  } else {
    return APP_BUNDLE_IDS.android.browserstack;
  }
}

/**
 * Terminates an app if it's running
 * @param bundleId - The app bundle ID to terminate
 */
async function terminateApp(bundleId: string): Promise<void> {
  try {
    await driver.terminateApp(bundleId);
    console.log(`Terminated existing app instance: ${bundleId}`);
  } catch (error) {
    console.log(`App not running or termination failed: ${bundleId}`);
  }
}

/**
 * Sets up local Android environment with ADB port forwarding
 */
async function setupLocalAndroidEnvironment(): Promise<void> {
  try {
    const adb = await ADB.createADB();
    await adb.reversePort(8545, 8545);
    await adb.reversePort(12345, 12345);
    console.log("ADB port forwarding configured for local Android testing");
  } catch (error) {
    console.error("Failed to setup local Android environment:", error);
    throw error;
  }
}

/**
 * Detects the current platform and environment from driver session
 * @returns Promise<AppLaunchConfig>
 */
export async function detectEnvironment(): Promise<AppLaunchConfig> {
  const capabilities = await driver.getSession();
  const isBrowserStack =
    capabilities["bstack:options"] ||
    process.argv.includes("browserstack.conf.ts");
  const platform = capabilities.platformName;
  
  console.log(`Platform: ${platform}, BrowserStack: ${isBrowserStack}`);
  
  return {
    platform,
    isBrowserStack
  };
}

/**
 * Convenience function to launch app with automatic environment detection
 * @param setupLocalEnvironment - Whether to setup local environment (default: true)
 * @returns Promise<void>
 */
export async function launchAppWithDetection(setupLocalEnvironment: boolean = true): Promise<void> {
  const config = await detectEnvironment();
  config.setupLocalEnvironment = setupLocalEnvironment;
  await launchApp(config);
} 