// Simple test suite for useSessionHistory hook
// Since the project doesn't have a formal testing framework set up,
// these are manual tests that can be run in the browser console or Node

import { useSessionHistory } from './useSessionHistory';

console.log('Testing useSessionHistory hook...');

// Mock localStorage for testing
const mockLocalStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value.toString();
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

// Temporarily replace localStorage
const originalLocalStorage = window.localStorage;
window.localStorage = mockLocalStorage;

// Test initialization
console.log('1. Testing initialization...');
const { sessions, saveSession, getSessionStats } = useSessionHistory();
console.log('Initial sessions:', sessions);
console.assert(Array.isArray(sessions), 'Sessions should be an array');

// Test saving a session
console.log('2. Testing saveSession...');
const testTranscript = [
  { speaker: 'me', text: 'Hello', timestamp: new Date().toISOString() },
  { speaker: 'them', text: 'Hi there!', timestamp: new Date().toISOString() }
];
const testBattery = 75;
const testInitialBattery = 100;
const testStats = { 
  totalCount: 2, 
  meCount: 1, 
  themCount: 1, 
  totalDrain: 25 
};

saveSession(testTranscript, testBattery, testInitialBattery, testStats);

// Get updated sessions
const { sessions: updatedSessions } = useSessionHistory();
console.log('Sessions after saving:', updatedSessions);
console.assert(updatedSessions.length === 1, 'Should have 1 session after saving');

// Test session properties
const savedSession = updatedSessions[0];
console.assert(savedSession.transcript.length === 2, 'Transcript should have 2 entries');
console.assert(savedSession.battery === 75, 'Battery should be 75');
console.assert(savedSession.initialBattery === 100, 'Initial battery should be 100');
console.assert(savedSession.stats.totalCount === 2, 'Stats should have total count of 2');

// Test session stats
console.log('3. Testing getSessionStats...');
const stats = getSessionStats();
console.log('Session stats:', stats);
console.assert(stats.totalSessions === 1, 'Should have 1 total session');
console.assert(stats.totalMessages === 2, 'Should have 2 total messages');

// Test export functionality
console.log('4. Testing exportSession...');
// Note: Actual export functionality would require DOM manipulation
// which is difficult to test without a full DOM environment

console.log('All tests completed!');
console.log('Note: This is a basic manual test. For comprehensive testing, a proper testing framework like Jest should be added to the project.');

// Restore original localStorage
window.localStorage = originalLocalStorage;