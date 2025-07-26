@temp @androidApp
Feature: Fixture Server Login Test
  As a test developer
  I want to verify that the fixture server provides a logged-in state
  So that I can skip the password entry step

  Background:
    Given I start the fixture server with login state
    And I fill my password in the Login screen

  Scenario: Verify fixture server provides logged-in state
    Given I am on the wallet screen
    Then I should not see the login screen
    And I should be able to access wallet features without password 