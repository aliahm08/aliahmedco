import fs from 'node:fs';
import Database from 'better-sqlite3';
import {appConfig, dataDirectory, databasePath} from './config.js';
import {createId, hashPassword} from './auth.js';

fs.mkdirSync(dataDirectory, {recursive: true});

export const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');

function createTables() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
      display_name TEXT NOT NULL,
      company_name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      client_user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      client_user_id TEXT,
      contact_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      company_name TEXT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      budget_range TEXT,
      desired_timeline TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS project_threads (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      author_user_id TEXT NOT NULL,
      body TEXT NOT NULL,
      internal_only INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (thread_id) REFERENCES project_threads(id) ON DELETE CASCADE,
      FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      uploader_user_id TEXT NOT NULL,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      byte_size INTEGER NOT NULL,
      visibility TEXT NOT NULL CHECK (visibility IN ('project', 'restricted')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (uploader_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS file_permissions (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      can_download INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (file_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_client_user_id ON projects(client_user_id);
    CREATE INDEX IF NOT EXISTS idx_project_threads_project_id ON project_threads(project_id);
    CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
    CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
  `);
}

function seedAdmin() {
  const existingAdmin = database
    .prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`)
    .get() as {id: string} | undefined;

  if (existingAdmin) {
    return;
  }

  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO users (id, email, password_hash, role, display_name, company_name, is_active, created_at, updated_at)
       VALUES (@id, @email, @password_hash, 'admin', @display_name, @company_name, 1, @created_at, @updated_at)`,
    )
    .run({
      id: createId('user'),
      email: appConfig.adminEmail.toLowerCase(),
      password_hash: hashPassword(appConfig.adminPassword),
      display_name: appConfig.adminName,
      company_name: 'Ali Ahmed Co',
      created_at: now,
      updated_at: now,
    });
}

export function initializeDatabase() {
  createTables();
  seedAdmin();
}
