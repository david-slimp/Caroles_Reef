// Mock for window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// Mock for ResizeObserver
class ResizeObserverMock {
  constructor(callback: ResizeObserverCallback) {
    // Store callback for testing
    (this as any).callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  
  // Helper method for testing
  trigger(entries: ResizeObserverEntry[]) {
    const cb = (this as any).callback as ResizeObserverCallback;
    if (cb) {
      cb(entries, this as unknown as ResizeObserver);
    }
  }
}

// Extend the global type declarations
declare global {
  // eslint-disable-next-line no-var
  var ResizeObserver: {
    new (callback: ResizeObserverCallback): ResizeObserver;
    prototype: ResizeObserver;
  };
}

// Assign the mock to the global object
window.ResizeObserver = ResizeObserverMock;
