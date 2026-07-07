# Release Checklist

This checklist is intended for the project maintainer and classmates validating a deployment or delivery of CampusShelf.

## Before Submission / Demo

### Environment

- [ ] `.env` file exists with valid credentials (see `.env.example`)
- [ ] `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` filled correctly
- [ ] `JWT_SECRET` set to a secure random string (not default)
- [ ] `PORT` (default 3000) not occupied by another service
- [ ] Node.js version >= 18.x confirmed (`node --version`)
- [ ] Docker Desktop running (if using MySQL via Docker)

### Database

- [ ] MySQL container running: `docker compose up -d` (or use `docker compose ps`)
- [ ] Database schema migrated: `node scripts/seed-mysql.js` (or equivalent)
- [ ] Test user seeded (if applicable) — check `scripts/seedUsers.js`
- [ ] JSON storage fallback tested: set `USE_JSON_DB=true` in `.env` and restart

### Application

- [ ] Dependencies installed: `npm install` (no errors)
- [ ] Application starts without crash: `npm start`
- [ ] Application binds to `http://localhost:3000` (or configured `PORT`)
- [ ] Login page renders
- [ ] Can register a new user
- [ ] Can browse / search listings
- [ ] Can create a listing (if authenticated)
- [ ] File upload works (images, attachments)

### Safety

- [ ] `.env` is in `.gitignore` — not committed
- [ ] No hardcoded credentials in source code
- [ ] No API tokens or secrets in commit history
- [ ] Database dump files not tracked by git
- [ ] `node_modules/` excluded from version control

### Documentation

- [ ] `README.md` Quick Start section reflects current setup steps
- [ ] `.env.example` updated with any new config keys
- [ ] Any environment-specific notes documented in `docs/`

## After Delivery

- [ ] Clean up any test accounts / test data
- [ ] Remove any debug logs or `console.log` inside routes
- [ ] Update `CHANGELOG.md` with release notes
- [ ] Tag release if publishing: `git tag v0.x.y && git push origin v0.x.y`
