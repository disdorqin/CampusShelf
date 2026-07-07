# Changelog

All notable changes to CampusShelf are documented here.

## [Unreleased]

### Added
- Release checklist (`docs/release-checklist.md`) for pre-submission validation
- Community health templates: PR template, bug report, feature request
- `CONTRIBUTING.md` and `SECURITY.md` for project governance
- `.editorconfig` for consistent editor settings

## [v3.1] — 2026-06

### Added
- Unified SVG icon system for UI v3.1
- Docker MySQL storage layer as primary backend
- Docker Compose setup for MySQL + Redis
- `.env.example` with documented configuration keys

### Changed
- UI overhaul to v3 design with modern layout
- README updated with Docker-first workflow instructions
- Seed scripts updated for MySQL compatibility

### Fixed
- Hardcoded database password removed from `db.js` and seed files
- Large `_reference` directory flattened and cleaned from repo

## [v3.0] — Earlier Milestones

- Full-stack campus learning resource trading platform
- User registration, login, and JWT-based authentication
- Book / resource listing with search and filtering
- File upload support for listing images
- JSON-based storage fallback when MySQL unavailable
- Heroku deployment support
- Tag accessibility improvements and error handling

---

This project does not follow semantic versioning strictly. Versions above are approximate labels based on major milestones in commit history.
