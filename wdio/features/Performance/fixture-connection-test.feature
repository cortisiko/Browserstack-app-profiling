@temp @androidApp
Feature: Fixture Server Connection Test
  As a test developer
  I want to verify that the app can connect to the fixture server
  So that I can ensure proper test state management

  Scenario: Verify fixture server connection
    Given I start the fixture server with login state
    Then the app should be connected to the fixture server 