#!/usr/bin/env node

import FixtureServer from '../e2e/fixtures/fixture-server.js';
import { startFixtureServer, loadFixture } from '../e2e/fixtures/fixture-helper.js';
import FixtureBuilder from '../e2e/fixtures/fixture-builder.js';

async function testFixtureServer() {
  console.log('=== Testing Fixture Server ===');
  
  try {
    // Create fixture server and state
    const fixtureServer = new FixtureServer();
    const state = new FixtureBuilder().withProfileSyncingEnabled().build();
    
    console.log('Fixture state built:');
    console.log('- Keys:', Object.keys(state));
    console.log('- Has engine:', !!state.engine);
    console.log('- Has user:', !!state.user);
    console.log('- Has asyncState:', !!state.asyncState);
    
    if (state.engine) {
      console.log('- Engine keys:', Object.keys(state.engine));
      if (state.engine.backgroundState) {
        console.log('- Background state controllers:', Object.keys(state.engine.backgroundState));
      }
    }
    
    // Start fixture server
    console.log('\n=== Starting Fixture Server ===');
    await startFixtureServer(fixtureServer);
    console.log('✅ Fixture server started');
    
    // Load fixture
    console.log('\n=== Loading Fixture State ===');
    await loadFixture(fixtureServer, { state });
    console.log('✅ Fixture state loaded');
    
    // Test server response
    console.log('\n=== Testing Server Response ===');
    const response = await fetch('http://localhost:14939/state.json');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data keys:', Object.keys(data));
      console.log('Response has engine:', !!data.engine);
      console.log('Response has user:', !!data.user);
      console.log('Response has asyncState:', !!data.asyncState);
      
      if (data.engine) {
        console.log('Response engine keys:', Object.keys(data.engine));
      }
      
      if (data.user) {
        console.log('Response user keys:', Object.keys(data.user));
      }
      
      if (data.asyncState) {
        console.log('Response asyncState keys:', Object.keys(data.asyncState));
      }
    } else {
      console.log('❌ Server responded with error status:', response.status);
    }
    
    // Stop server
    console.log('\n=== Stopping Fixture Server ===');
    await fixtureServer.stop();
    console.log('✅ Fixture server stopped');
    
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testFixtureServer(); 