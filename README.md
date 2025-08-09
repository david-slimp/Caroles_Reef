# Carole's Reef

**Carole's Reef** is a calm, immersive 3D aquarium game where you can enjoy a colorful reef environment, interact with fish, decorate with corals and ornaments, and discover new fish traits through gentle breeding and exploration. It's designed to be **relaxing, uplifting, and easy to enjoy** — especially for players who prefer a slow pace and simple interactions.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r162-000000.svg)](https://threejs.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![ESLint](https://img.shields.io/badge/ESLint-8.56.0-4B32C3.svg)](https://eslint.org/)
[![Jest](https://img.shields.io/badge/Jest-29.7.0-C21325.svg)](https://jestjs.io/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/david-slimp/Caroles_Reef.git
   cd Caroles_Reef
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run format` - Format code with Prettier

### Code Style

We use:
- **TypeScript** with strict type checking
- **ESLint** for code quality
- **Prettier** for code formatting
- **Husky** with **lint-staged** for pre-commit hooks

### Git Workflow

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. Push your changes and create a pull request

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Example:
```
feat(fish): add new clownfish model

- Added 3D model for clownfish
- Implemented basic swimming animation
- Added color variations

Closes #123
```

## 🌊 The Full Vision

When fully developed, Carole's Reef will feature:

* A **large, fully navigable 3D reef tank** you can explore from any angle.
* **Many species of fish and marine life**, each with unique traits, personalities, and genetic variations.
* **Breeding and genetics**: raise fish, see their offspring inherit traits, and discover rare combinations.
* **Interactive ornaments** like corals, sea plants, structures, and even a small whirlpool for removing unwanted items.
* **Occasional uplifting messages** from fish, ranging from happy thoughts to short, encouraging or philosophical lines.
* **Customizable environment** with decorations you can arrange anywhere in the tank.
* An emphasis on **calm, enjoyable observation** over fast-paced or competitive gameplay.

## 🐠 Current Development Stage

We're still in the very early stages of building Carole's Reef.
Right now, the **MVP (Minimum Viable Product)** focus is on:

* Creating a small test tank in 3D space.
* Adding a few fish to swim in the environment (currently simple placeholder shapes).
* Adding basic corals or ornaments.
* Smooth camera controls so players can look around the tank.
* A simple button to add more fish.

This early version is mostly about getting the **core space and camera working** before adding the deeper gameplay systems.

## 🏗 Project Structure

```
src/
├── main.ts           # Application entry point
├── scene.ts         # Main 3D scene setup
├── fish.ts          # Fish-related logic and components
├── coral.ts         # Coral and decoration components
└── types/           # TypeScript type definitions

tests/               # Test files
├── setupTests.ts    # Test setup and utilities
└── fish.test.ts     # Tests for fish module
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Three.js](https://threejs.org/)
- Inspired by peaceful aquarium simulations
- Special thanks to all contributors
This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.
You are free to use, modify, and share the code under the same license, but any modified version made available to others (even over a network) must also be shared under AGPL-3.0.
