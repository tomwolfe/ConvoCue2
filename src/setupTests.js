import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Worker
class WorkerMock {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {};
  }
  postMessage(msg) {
    this.onmessage({ data: msg });
  }
  terminate() {}
}

global.Worker = WorkerMock;

// Mock navigator.vibrate
if (typeof navigator !== 'undefined') {
  navigator.vibrate = vi.fn();
}
