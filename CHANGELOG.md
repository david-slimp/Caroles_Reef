# Changelog

## [0.0.4] - 2025-08-10
### Added
- Debug visualization for fish orientation with colored markers
- Green target ball and line showing fish's target
- Red line showing fish's actual orientation
- Blue and yellow markers for fish nose and tail positions

### Changed
- Completely rewrote fish orientation and movement logic
- Fish now align nose and tail with target direction
- Improved fish movement to always swim forward toward target
- Enhanced fish rotation for more natural movement
- Fixed fish swimming backward after alignment
- Updated Three.js to latest version
- Optimized fish update loop for better performance

## [0.0.3] - 2025-08-09
### Added
- New fish model with realistic shape and features
- Fish now have eyes and proper tail fins
- More natural fish movement with body undulation
- Added favicon for better browser tab identification

### Changed
- Updated fish geometry from box to a more organic shape
- Improved fish materials and textures
- Enhanced fish swimming animation

## [0.0.2] - 2025-08-09
### Added
- Fish movement with natural swimming behavior
- Coral decoration in the tank
- "Add Fish" button to add more fish
- Boundary detection to keep fish within tank
- Smooth camera controls with orbit, pan, and zoom

### Changed
- Updated tank floor to a light golden sandy color
- Improved floor material with better lighting properties
- Added version display in the UI
- Centralized version management in config/version.ts
- Enhanced fish movement to be more natural and fluid
- Increased coral size and visibility
- Adjusted fish speed for more realistic movement

## [0.0.1] - 2025-08-09
### Initial Release

### Added
- Default .gitignore
- Default PRD - then updated from ideas enhanced with  ChatGPT 
- Basic 3D scene setup with Three.js
- Vite development environment
- TypeScript configuration
- Basic scene with a rotating cube
- Orbit controls for camera movement
- Responsive layout
- Development server setup
- GitHub repository initialization
- Project documentation (README.md, PRD.md, MVP.md)

### Changed
- Updated README.md with project overview and vision
- Configured TypeScript with proper settings
- Set up Vite with Three.js integration
- Organized project structure
- LICENSE.txt - AGPL3
- Default README.md

### Fixed
- Resolved TypeScript configuration issues
- Fixed Vite development server setup
- Addressed initial setup bugs

### Known Issues
- Basic 3D scene is functional but minimal
- Fish and coral functionality not yet implemented
- UI is currently very basic
- Need to create dev_notes.txt for development tracking

