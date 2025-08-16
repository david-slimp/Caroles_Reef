# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+ or pnpm 8+
- Git

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open http://localhost:8000 in your browser

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
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
- E2E tests: `npm test:e2e`
