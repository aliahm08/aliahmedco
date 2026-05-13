import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express, {NextFunction, Request, Response} from 'express';
import {
  clearSessionCookie,
  createId,
  createSessionCookie,
  parseCookies,
  sanitizeFileName,
  signSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from './auth.js';
import {
  appConfig,
  projectRoot,
  sessionCookieName,
  sessionDurationMs,
  uploadDirectory,
} from './config.js';
import {database, initializeDatabase} from './db.js';

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'client';
  display_name: string;
  company_name: string | null;
  is_active: number;
};

type SessionUser = Omit<UserRow, 'password_hash' | 'is_active'>;

declare global {
  namespace Express {
    interface Request {
      currentUser?: SessionUser;
      currentSessionId?: string;
    }
  }
}

initializeDatabase();
fs.mkdirSync(uploadDirectory, {recursive: true});

const app = express();

app.use(express.json({limit: '2mb'}));

function asyncRoute(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void> | void,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function toPublicUser(user: UserRow): SessionUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    display_name: user.display_name,
    company_name: user.company_name,
  };
}

function getCurrentUser(request: Request) {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[sessionCookieName];

  if (!token) {
    return null;
  }

  const sessionId = verifySessionToken(token, appConfig.sessionSecret);

  if (!sessionId) {
    return null;
  }

  const session = database
    .prepare(
      `SELECT sessions.id AS session_id, users.*
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.id = ? AND sessions.expires_at > ? AND users.is_active = 1`,
    )
    .get(sessionId, new Date().toISOString()) as (UserRow & {session_id: string}) | undefined;

  if (!session) {
    return null;
  }

  request.currentSessionId = session.session_id;
  request.currentUser = toPublicUser(session);
  return request.currentUser;
}

function requireAuth(request: Request, response: Response, next: NextFunction) {
  const user = getCurrentUser(request);

  if (!user) {
    response.status(401).json({error: 'Authentication required.'});
    return;
  }

  next();
}

function requireAdmin(request: Request, response: Response, next: NextFunction) {
  const user = getCurrentUser(request);

  if (!user) {
    response.status(401).json({error: 'Authentication required.'});
    return;
  }

  if (user.role !== 'admin') {
    response.status(403).json({error: 'Admin access required.'});
    return;
  }

  next();
}

function projectAccessibleToUser(projectId: string, user: SessionUser) {
  const project = database
    .prepare(
      `SELECT id, client_user_id
       FROM projects
       WHERE id = ?`,
    )
    .get(projectId) as {id: string; client_user_id: string} | undefined;

  if (!project) {
    return false;
  }

  return user.role === 'admin' || project.client_user_id === user.id;
}

function threadAccessibleToUser(threadId: string, user: SessionUser) {
  const thread = database
    .prepare(
      `SELECT project_threads.id, projects.client_user_id
       FROM project_threads
       JOIN projects ON projects.id = project_threads.project_id
       WHERE project_threads.id = ?`,
    )
    .get(threadId) as {id: string; client_user_id: string} | undefined;

  if (!thread) {
    return false;
  }

  return user.role === 'admin' || thread.client_user_id === user.id;
}

function fileAccessibleToUser(fileId: string, user: SessionUser) {
  const file = database
    .prepare(
      `SELECT files.id, files.visibility, projects.client_user_id,
              EXISTS(
                SELECT 1
                FROM file_permissions
                WHERE file_permissions.file_id = files.id
                  AND file_permissions.user_id = ?
                  AND file_permissions.can_download = 1
              ) AS has_explicit_permission
       FROM files
       JOIN projects ON projects.id = files.project_id
       WHERE files.id = ? AND files.is_active = 1`,
    )
    .get(user.id, fileId) as
    | {id: string; visibility: 'project' | 'restricted'; client_user_id: string; has_explicit_permission: number}
    | undefined;

  if (!file) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  if (file.visibility === 'project' && file.client_user_id === user.id) {
    return true;
  }

  return file.has_explicit_permission === 1;
}

app.get(
  '/api/health',
  asyncRoute(async (_request, response) => {
    response.json({ok: true});
  }),
);

app.post(
  '/api/auth/sign-in',
  asyncRoute(async (request, response) => {
    const email = String(request.body?.email ?? '').trim().toLowerCase();
    const password = String(request.body?.password ?? '');

    if (!email || !password) {
      response.status(400).json({error: 'Email and password are required.'});
      return;
    }

    const user = database
      .prepare(`SELECT * FROM users WHERE email = ? AND is_active = 1`)
      .get(email) as UserRow | undefined;

    if (!user || !verifyPassword(password, user.password_hash)) {
      response.status(401).json({error: 'Invalid credentials.'});
      return;
    }

    const sessionId = createId('session');
    const expiresAt = new Date(Date.now() + sessionDurationMs).toISOString();

    database
      .prepare(`INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`)
      .run(sessionId, user.id, expiresAt, new Date().toISOString());

    const token = signSessionToken(sessionId, appConfig.sessionSecret);
    response.setHeader('Set-Cookie', createSessionCookie(token, sessionDurationMs));
    response.json({user: toPublicUser(user)});
  }),
);

app.post(
  '/api/auth/sign-out',
  requireAuth,
  asyncRoute(async (request, response) => {
    if (request.currentSessionId) {
      database.prepare(`DELETE FROM sessions WHERE id = ?`).run(request.currentSessionId);
    }

    response.setHeader('Set-Cookie', clearSessionCookie());
    response.status(204).send();
  }),
);

app.get(
  '/api/auth/me',
  asyncRoute(async (request, response) => {
    const user = getCurrentUser(request);

    if (!user) {
      response.json({user: null});
      return;
    }

    response.json({user});
  }),
);

app.get(
  '/api/projects',
  requireAuth,
  asyncRoute(async (request, response) => {
    const user = request.currentUser!;
    const query =
      user.role === 'admin'
        ? `SELECT projects.*, users.display_name, users.company_name
           FROM projects
           JOIN users ON users.id = projects.client_user_id
           ORDER BY projects.updated_at DESC`
        : `SELECT projects.*, users.display_name, users.company_name
           FROM projects
           JOIN users ON users.id = projects.client_user_id
           WHERE projects.client_user_id = ?
           ORDER BY projects.updated_at DESC`;
    const projects =
      user.role === 'admin'
        ? database.prepare(query).all()
        : database.prepare(query).all(user.id);

    response.json({projects});
  }),
);

app.post(
  '/api/projects',
  requireAdmin,
  asyncRoute(async (request, response) => {
    const {clientUserId, name, status, summary} = request.body ?? {};

    if (!clientUserId || !name || !status || !summary) {
      response.status(400).json({error: 'clientUserId, name, status, and summary are required.'});
      return;
    }

    const now = new Date().toISOString();
    const projectId = createId('project');
    const threadId = createId('thread');

    const transaction = database.transaction(() => {
      database
        .prepare(
          `INSERT INTO projects (id, client_user_id, name, status, summary, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(projectId, clientUserId, name, status, summary, now, now);

      database
        .prepare(
          `INSERT INTO project_threads (id, project_id, subject, created_by_user_id, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(threadId, projectId, `${name} - Project Thread`, request.currentUser!.id, now);
    });

    transaction();
    response.status(201).json({projectId, defaultThreadId: threadId});
  }),
);

app.get(
  '/api/proposals',
  requireAdmin,
  asyncRoute(async (_request, response) => {
    const proposals = database
      .prepare(`SELECT * FROM proposals ORDER BY created_at DESC`)
      .all();
    response.json({proposals});
  }),
);

app.post(
  '/api/proposals',
  asyncRoute(async (request, response) => {
    const {
      contactName,
      contactEmail,
      companyName,
      title,
      summary,
      budgetRange,
      desiredTimeline,
      clientUserId,
    } = request.body ?? {};

    if (!contactName || !contactEmail || !title || !summary) {
      response.status(400).json({error: 'contactName, contactEmail, title, and summary are required.'});
      return;
    }

    const now = new Date().toISOString();
    const proposalId = createId('proposal');

    database
      .prepare(
        `INSERT INTO proposals (
           id, client_user_id, contact_name, contact_email, company_name, title, summary,
           budget_range, desired_timeline, status, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
      )
      .run(
        proposalId,
        clientUserId ?? null,
        contactName,
        String(contactEmail).trim().toLowerCase(),
        companyName ?? null,
        title,
        summary,
        budgetRange ?? null,
        desiredTimeline ?? null,
        now,
      );

    response.status(201).json({proposalId});
  }),
);

app.get(
  '/api/threads',
  requireAuth,
  asyncRoute(async (request, response) => {
    const user = request.currentUser!;
    const threads =
      user.role === 'admin'
        ? database
            .prepare(
              `SELECT project_threads.*, projects.name AS project_name, users.display_name AS client_name
               FROM project_threads
               JOIN projects ON projects.id = project_threads.project_id
               JOIN users ON users.id = projects.client_user_id
               ORDER BY project_threads.created_at DESC`,
            )
            .all()
        : database
            .prepare(
              `SELECT project_threads.*, projects.name AS project_name, users.display_name AS client_name
               FROM project_threads
               JOIN projects ON projects.id = project_threads.project_id
               JOIN users ON users.id = projects.client_user_id
               WHERE projects.client_user_id = ?
               ORDER BY project_threads.created_at DESC`,
            )
            .all(user.id);

    response.json({threads});
  }),
);

app.get(
  '/api/threads/:threadId/messages',
  requireAuth,
  asyncRoute(async (request, response) => {
    const user = request.currentUser!;
    const {threadId} = request.params;

    if (!threadAccessibleToUser(threadId, user)) {
      response.status(403).json({error: 'You do not have access to this thread.'});
      return;
    }

    const messages =
      user.role === 'admin'
        ? database
            .prepare(
              `SELECT messages.*, users.display_name AS author_name, users.role AS author_role
               FROM messages
               JOIN users ON users.id = messages.author_user_id
               WHERE messages.thread_id = ?
               ORDER BY messages.created_at ASC`,
            )
            .all(threadId)
        : database
            .prepare(
              `SELECT messages.*, users.display_name AS author_name, users.role AS author_role
               FROM messages
               JOIN users ON users.id = messages.author_user_id
               WHERE messages.thread_id = ? AND messages.internal_only = 0
               ORDER BY messages.created_at ASC`,
            )
            .all(threadId);

    response.json({messages});
  }),
);

app.post(
  '/api/threads/:threadId/messages',
  requireAuth,
  asyncRoute(async (request, response) => {
    const user = request.currentUser!;
    const {threadId} = request.params;
    const body = String(request.body?.body ?? '').trim();
    const internalOnly = Boolean(request.body?.internalOnly);

    if (!threadAccessibleToUser(threadId, user)) {
      response.status(403).json({error: 'You do not have access to this thread.'});
      return;
    }

    if (!body) {
      response.status(400).json({error: 'Message body is required.'});
      return;
    }

    if (internalOnly && user.role !== 'admin') {
      response.status(403).json({error: 'Only admins can post internal notes.'});
      return;
    }

    const messageId = createId('message');
    database
      .prepare(
        `INSERT INTO messages (id, thread_id, author_user_id, body, internal_only, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(messageId, threadId, user.id, body, internalOnly ? 1 : 0, new Date().toISOString());

    response.status(201).json({messageId});
  }),
);

app.get(
  '/api/files',
  requireAuth,
  asyncRoute(async (request, response) => {
    const user = request.currentUser!;
    const files =
      user.role === 'admin'
        ? database
            .prepare(
              `SELECT files.*, projects.name AS project_name, users.display_name AS client_name
               FROM files
               JOIN projects ON projects.id = files.project_id
               JOIN users ON users.id = projects.client_user_id
               WHERE files.is_active = 1
               ORDER BY files.created_at DESC`,
            )
            .all()
        : database
            .prepare(
              `SELECT files.*, projects.name AS project_name, users.display_name AS client_name
               FROM files
               JOIN projects ON projects.id = files.project_id
               JOIN users ON users.id = projects.client_user_id
               LEFT JOIN file_permissions
                 ON file_permissions.file_id = files.id
                AND file_permissions.user_id = ?
                AND file_permissions.can_download = 1
               WHERE files.is_active = 1
                 AND (
                   (files.visibility = 'project' AND projects.client_user_id = ?)
                   OR file_permissions.id IS NOT NULL
                 )
               ORDER BY files.created_at DESC`,
            )
            .all(user.id, user.id);

    response.json({files});
  }),
);

app.post(
  '/api/files/upload',
  requireAdmin,
  express.raw({type: '*/*', limit: '50mb'}),
  asyncRoute(async (request, response) => {
    const projectId = String(request.headers['x-project-id'] ?? '').trim();
    const originalName = String(request.headers['x-file-name'] ?? '').trim();
    const mimeType = String(request.headers['x-file-type'] ?? 'application/octet-stream').trim();
    const visibilityHeader = String(request.headers['x-visibility'] ?? 'project').trim();
    const allowedUserIds = String(request.headers['x-allowed-user-ids'] ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!projectId || !originalName || !Buffer.isBuffer(request.body) || request.body.length === 0) {
      response.status(400).json({error: 'projectId, fileName, and binary request body are required.'});
      return;
    }

    if (!projectAccessibleToUser(projectId, request.currentUser!)) {
      response.status(404).json({error: 'Project not found.'});
      return;
    }

    const visibility = visibilityHeader === 'restricted' ? 'restricted' : 'project';
    const fileId = createId('file');
    const storedName = `${fileId}-${sanitizeFileName(originalName)}`;
    const storagePath = path.join(uploadDirectory, storedName);
    const now = new Date().toISOString();

    fs.writeFileSync(storagePath, request.body);

    const transaction = database.transaction(() => {
      database
        .prepare(
          `INSERT INTO files (
             id, project_id, uploader_user_id, original_name, stored_name, storage_path,
             mime_type, byte_size, visibility, is_active, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        )
        .run(
          fileId,
          projectId,
          request.currentUser!.id,
          originalName,
          storedName,
          storagePath,
          mimeType,
          request.body.length,
          visibility,
          now,
        );

      for (const userId of allowedUserIds) {
        database
          .prepare(
            `INSERT OR IGNORE INTO file_permissions (id, file_id, user_id, can_download, created_at)
             VALUES (?, ?, ?, 1, ?)`,
          )
          .run(createId('perm'), fileId, userId, now);
      }
    });

    transaction();
    response.status(201).json({fileId});
  }),
);

app.get(
  '/api/files/:fileId/download',
  requireAuth,
  asyncRoute(async (request, response) => {
    const user = request.currentUser!;
    const {fileId} = request.params;

    if (!fileAccessibleToUser(fileId, user)) {
      response.status(403).json({error: 'You do not have access to this file.'});
      return;
    }

    const file = database
      .prepare(
        `SELECT original_name, storage_path, mime_type
         FROM files
         WHERE id = ? AND is_active = 1`,
      )
      .get(fileId) as {original_name: string; storage_path: string; mime_type: string} | undefined;

    if (!file || !fs.existsSync(file.storage_path)) {
      response.status(404).json({error: 'File not found.'});
      return;
    }

    response.download(file.storage_path, file.original_name, {
      headers: {
        'Content-Type': file.mime_type,
      },
    });
  }),
);

app.post(
  '/api/admin/clients',
  requireAdmin,
  asyncRoute(async (request, response) => {
    const {email, password, displayName, companyName} = request.body ?? {};

    if (!email || !password || !displayName) {
      response.status(400).json({error: 'email, password, and displayName are required.'});
      return;
    }

    const now = new Date().toISOString();
    const clientId = createId('user');

    database
      .prepare(
        `INSERT INTO users (id, email, password_hash, role, display_name, company_name, is_active, created_at, updated_at)
         VALUES (?, ?, ?, 'client', ?, ?, 1, ?, ?)`,
      )
      .run(
        clientId,
        String(email).trim().toLowerCase(),
        hashPassword(String(password)),
        displayName,
        companyName ?? null,
        now,
        now,
      );

    response.status(201).json({clientId});
  }),
);

app.get(
  '/api/admin/clients',
  requireAdmin,
  asyncRoute(async (_request, response) => {
    const clients = database
      .prepare(
        `SELECT id, email, role, display_name, company_name, is_active, created_at, updated_at
         FROM users
         WHERE role = 'client'
         ORDER BY created_at DESC`,
      )
      .all();
    response.json({clients});
  }),
);

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  response.status(500).json({error: 'Internal server error.'});
});

const distDirectory = path.join(projectRoot, 'dist');

if (fs.existsSync(distDirectory)) {
  app.use(express.static(distDirectory));
  app.get('*', (_request, response) => {
    response.sendFile(path.join(distDirectory, 'index.html'));
  });
}

app.listen(appConfig.port, () => {
  console.log(`Client portal server listening on http://localhost:${appConfig.port}`);
  console.log(`Seed admin email: ${appConfig.adminEmail}`);
  if (appConfig.adminPassword === 'change-me-now') {
    console.log('Seed admin password: change-me-now');
  }
});
