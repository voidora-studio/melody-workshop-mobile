// Build-time injected info
// In release builds, CI/CD replaces these values via metro.config.js
// For dev builds, we read from git directly

export const buildInfo = {
  commitHash: 'dev',
  commitDate: new Date().toISOString().slice(0, 10),
  buildTime: new Date().toISOString().slice(0, 10),
}
