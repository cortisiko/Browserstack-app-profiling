# BrowserStack Helper Functions

This module provides utilities for managing BrowserStack Local tunnel in e2e tests.

## Functions

### `ensureBrowserStackLocalAccess()`
Checks if BrowserStack Local tunnel is accessible and can reach the fixture server. Only restarts the tunnel if it's not accessible or cannot reach the fixture server.

**Usage:**
```typescript
import { ensureBrowserStackLocalAccess } from '../utils/browserstack-helper';

// In your test setup
before(async () => {
  await startFixtureServer(fixtureServer);
  await loadFixture(fixtureServer, { fixture: state });
  
  // Ensure tunnel can access fixture server
  await ensureBrowserStackLocalAccess();
});
```

### `restartBrowserStackLocal()`
Restarts the BrowserStack Local tunnel after fixture server is loaded. This ensures the tunnel can access the fixture server with the loaded state.

**Usage:**
```typescript
import { restartBrowserStackLocal } from '../utils/browserstack-helper';

// In your test setup
before(async () => {
  await startFixtureServer(fixtureServer);
  await loadFixture(fixtureServer, { fixture: state });
  
  // Restart tunnel to access fixture server
  await restartBrowserStackLocal();
});
```

### `isBrowserStackLocalRunning()`
Checks if BrowserStack Local tunnel is currently running.

**Returns:** `Promise<boolean>`

### `getTunnelStatus()`
Gets the current status of BrowserStack Local tunnel.

**Returns:** `Promise<string>`

## Environment Variables Required

- `BROWSERSTACK_ACCESS_KEY`: Your BrowserStack access key
- `GITHUB_RUN_ID`: GitHub Actions run ID (automatically set by GitHub)

## How It Works

### `ensureBrowserStackLocalAccess()`:
1. **Checks if tunnel is running** using `pgrep`
2. **Tests fixture server access** using `curl http://localhost:12345/state.json`
3. **Only restarts if needed** - if tunnel is down or can't access fixture server
4. **Provides detailed logging** for debugging

### `restartBrowserStackLocal()`:
1. **Kills existing tunnel** using `pkill -f BrowserStackLocal`
2. **Waits for process to stop** (3 seconds)
3. **Restarts tunnel** with same configuration
4. **Waits for tunnel to be ready** (5 seconds)
5. **Verifies fixture server access** with curl

## Error Handling

The functions include comprehensive error handling:
- Validates environment variables
- Gracefully handles process termination
- Provides detailed logging
- Continues test execution even if operations fail

## Integration with Tests

The helper is designed to be used in test setup after fixture server is loaded:

```typescript
// 1. Start fixture server
await startFixtureServer(fixtureServer);

// 2. Load fixture state
await loadFixture(fixtureServer, { fixture: state });

// 3. Ensure tunnel can access fixture server
if (isBrowserStack) {
  await ensureBrowserStackLocalAccess();
}
```

This ensures BrowserStack Local tunnel can access the same fixture state that your tests are using, without unnecessarily restarting the tunnel if it's already working. 