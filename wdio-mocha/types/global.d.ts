declare global {
  const driver: any;
  const describe: (name: string, fn: () => void) => void;
  const it: (name: string, fn: () => void) => void;
  const beforeAll: (fn: () => void) => void;
  const beforeEach: (fn: () => void) => void;
  const afterAll: (fn: () => void) => void;
  const expect: (actual: any) => any;
}

export {}; 