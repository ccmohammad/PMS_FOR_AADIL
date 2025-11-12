declare global {
  namespace NodeJS {
    interface Global {
      mongoose: {
        conn: import('mongoose') | null;
        promise: Promise<import('mongoose')> | null;
      }
    }
  }
} 