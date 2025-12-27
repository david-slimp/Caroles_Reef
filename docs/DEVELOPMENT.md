# Development Guide

## Status

- Mixed: reflects current scripts but some workflow notes are aspirational

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+ or pnpm 8+
- Git

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open the URL printed by Vite (typically http://localhost:5173)

## Development Workflow

### Branching Strategy (planned)

- `main` - Production-ready code
- `develop` - Integration branch for features (if used)
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates

### Commits

- Follow [Conventional Commits](https://www.conventionalcommits.org/)
- Use present tense ("add feature" not "added feature")
- Keep commits focused and atomic

### Pull Requests

- Reference related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation as needed

## Testing

- Unit tests: `npm test`
- Watch mode: `npm test:watch`
- Coverage: `npm test:coverage`
