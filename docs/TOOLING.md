# Development Tooling

## Core Tools

### Package Management

- **npm** - Default package manager
- **pnpm** - Faster, disk-space efficient alternative

### Development Server

- **Vite** - Fast development server with HMR
  - Config: `vite.config.ts`
  - Start: `npm run dev`

### Code Quality

- **ESLint** - JavaScript/TypeScript linting
  - Config: `.eslintrc.json`
  - Run: `npm run lint`
- **Prettier** - Code formatting
  - Config: `.prettierrc`
  - Run: `npm run format`
- **Stylelint** - CSS/SCSS linting
  - Config: `.stylelintrc.json`
  - Run: `npm run lint:styles`

### Testing

- **Vitest** - Test runner
  - Config: `vitest.config.ts`
  - Run tests: `npm test`
  - Watch mode: `npm test:watch`
  - Coverage: `npm test:coverage`

### Git Hooks

- **Husky** - Git hooks
  - Pre-commit: Runs linting and tests
  - Commit-msg: Validates commit messages

## Editor Configuration

### VS Code

- Recommended extensions in `.vscode/extensions.json`
- Settings in `.vscode/settings.json`

## Build & Deployment

- **Vite** - Production build
  - Build: `npm run build`
  - Preview: `npm run preview`
- **GitHub Actions** - CI/CD
  - Workflows in `.github/workflows/`

## Performance Tools

- **Chrome DevTools** - Performance profiling
- **Lighthouse** - Web performance metrics
- **Bundle Analyzer** - Bundle size analysis

## Debugging

- VS Code launch configurations in `.vscode/launch.json`
- Source maps enabled in development
