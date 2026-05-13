import path from 'node:path';

export const projectRoot = process.cwd();
export const dataDirectory = path.join(projectRoot, 'data');
export const uploadDirectory = path.join(projectRoot, 'uploads', 'client-assets');
export const databasePath = path.join(dataDirectory, 'client-portal.sqlite');
export const sessionCookieName = 'aa_portal_session';
export const sessionDurationMs = 1000 * 60 * 60 * 24 * 14;

export const appConfig = {
  port: Number(process.env.PORT ?? 4000),
  adminEmail: process.env.ADMIN_EMAIL?.trim() || 'admin@aliahmedco.local',
  adminPassword: process.env.ADMIN_PASSWORD?.trim() || 'change-me-now',
  adminName: process.env.ADMIN_NAME?.trim() || 'Ali Ahmed',
  sessionSecret: process.env.SESSION_SECRET?.trim() || 'local-development-secret',
  appOrigin: process.env.APP_ORIGIN?.trim() || 'http://localhost:3000',
} as const;
