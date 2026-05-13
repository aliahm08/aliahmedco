declare module 'better-sqlite3' {
  class Database {
    constructor(path: string);
    pragma(statement: string): unknown;
    exec(sql: string): void;
    prepare(sql: string): {
      get: (...params: unknown[]) => unknown;
      all: (...params: unknown[]) => unknown[];
      run: (...params: unknown[]) => {changes: number; lastInsertRowid: number | bigint};
    };
    transaction<T extends (...args: never[]) => unknown>(fn: T): T;
  }

  export default Database;
}
