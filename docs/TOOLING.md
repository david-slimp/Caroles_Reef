# Development Tooling

## Status

- Mixed: reflects current scripts; some tools are installed but not wired yet

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
- **Stylelint** - Installed but not currently wired (no config/script yet)

### Testing

- **Vitest** - Test runner
  - Config: `vitest.config.ts`
  - Run tests: `npm test`
  - Watch mode: `npm test:watch`
  - Coverage: `npm test:coverage`

### Git Hooks

- **Husky** - Git hooks
  - Pre-commit: Runs `lint-staged`

## Editor Configuration

### VS Code

- No project-level VS Code config currently checked in

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
