# Contributing to CampusShelf

Thank you for considering contributing to CampusShelf! This document outlines the guidelines for contributing to this project.

## Getting Started

1. Fork the repository.
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/CampusShelf.git
   ```
3. Set up the development environment (see [README](README.md#quick-start)).
4. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

- **Node.js** >= 18.x
- **Docker Desktop** (for MySQL + Redis)
- See [README Quick Start](README.md#quick-start) for full setup instructions

## Code Style

- **JavaScript**: Follow existing patterns in the codebase (ES6+)
- **Handlebars templates**: Keep templates readable; avoid inline logic
- **CSS**: Follow the existing naming convention in `public/css/`
- **Commit messages**: Use conventional commits format:
  - `feat:` — new feature
  - `fix:` — bug fix
  - `docs:` — documentation only
  - `refactor:` — code restructuring
  - `perf:` — performance improvement
  - `chore:` — tooling, dependencies, CI

## Pull Request Process

1. Ensure your code works with **both MySQL and JSON storage modes**.
2. Update relevant documentation if your change affects setup or usage.
3. Make sure your PR description follows the [PR template](.github/pull_request_template.md).
4. Keep PRs small and focused on a single concern.

## Testing

This project currently does not have an automated test suite. When contributing:

- Manually test your changes with both storage modes if applicable
- Verify the UI renders correctly in modern browsers (Chrome, Firefox, Edge)

## Questions?

Open a [discussion](https://github.com/disdorqin/CampusShelf/discussions) or file an issue.
