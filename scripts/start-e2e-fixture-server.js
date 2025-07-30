#!/usr/bin/env node

const Koa = require('koa');

const CURRENT_STATE_KEY = '__CURRENT__';
const DEFAULT_STATE_KEY = '__DEFAULT__';
const FIXTURE_SERVER_HOST = '0.0.0.0'; // Make it network accessible for BrowserStack
const DEFAULT_FIXTURE_SERVER_PORT = 12345;

function getFixturesServerPort() {
  return DEFAULT_FIXTURE_SERVER_PORT;
}

class FixtureServer {
  constructor() {
    this._app = new Koa();
    this._stateMap = new Map([[DEFAULT_STATE_KEY, Object.create(null)]]);

    this._app.use(async (ctx) => {
      // Middleware to handle requests
      ctx.set('Access-Control-Allow-Origin', '*');
      ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      ctx.set(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
      );
      // Check if it's a request for the current state
      if (this._isStateRequest(ctx)) {
        ctx.body = this._stateMap.get(CURRENT_STATE_KEY);
      }
    });
  }

  // Start the fixture server
  async start() {
    const options = {
      host: FIXTURE_SERVER_HOST,
      port: getFixturesServerPort(),
      exclusive: true,
    };

    return new Promise((resolve, reject) => {
      console.log(`Starting fixture server on ${FIXTURE_SERVER_HOST}:${getFixturesServerPort()}`);
      this._server = this._app.listen(options);
      this._server.once('error', reject);
      this._server.once('listening', resolve);
    });
  }

  // Stop the fixture server
  async stop() {
    if (!this._server) {
      return;
    }

    await new Promise((resolve, reject) => {
      console.log('Stopping fixture server...');
      this._server.close();
      this._server.once('error', reject);
      this._server.once('close', resolve);
      this._server = undefined;
    });
  }

  // Load JSON state into the server
  loadJsonState(rawState, contractRegistry) {
    console.log('Loading JSON state...');
    const state = rawState; // Simplified - no substitutions for now
    this._stateMap.set(CURRENT_STATE_KEY, state);
    console.log('JSON state loaded');
  }

  // Check if the request is for the current state
  _isStateRequest(ctx) {
    return ctx.method === 'GET' && ctx.path === '/state.json';
  }
}

async function startE2EFixtureServer() {
  try {
    console.log('Starting E2E fixture server...');
    const fixtureServer = new FixtureServer();
    await fixtureServer.start();
    
    const port = getFixturesServerPort();
    console.log(`✅ E2E fixture server started on port ${port}`);
    console.log(`📡 Server accessible at: http://localhost:${port}/state.json`);
    console.log(`📡 Server accessible at: http://0.0.0.0:${port}/state.json`);
    
    // Keep the server running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT, shutting down fixture server...');
      try {
        await fixtureServer.stop();
        console.log('✅ Fixture server stopped gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error stopping fixture server:', error);
        process.exit(1);
      }
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down fixture server...');
      try {
        await fixtureServer.stop();
        console.log('✅ Fixture server stopped gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error stopping fixture server:', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start E2E fixture server:', error);
    process.exit(1);
  }
}

startE2EFixtureServer(); 