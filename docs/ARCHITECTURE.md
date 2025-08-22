# Carole's Reef - Architecture

## Overview

Carole's Reef is an aquarium simulation featuring procedurally generated fish with genetic traits. This document outlines the high-level architecture and design decisions.

## Core Concepts

### Data Flow

```fish
graph TD
    A[User Input] --> B[Input System]
    B --> C[Game State]
    C --> D[Game Systems]
    D --> E[Rendering]
    D --> C
```

### Key Components

#### State Management

- Single source of truth in `/state/store.ts`
- Immutable updates via actions
- Selectors for derived state

#### Rendering

- Pure functions that take state and render to canvas
- Separate from game logic
- Optimized for performance

#### Systems

- Stateless functions that transform game state
- Run in a fixed update loop
- Can be tested in isolation

## Performance Considerations

- Spatial partitioning for collision detection
- Object pooling for frequently created/destroyed entities
- Efficient rendering with canvas optimizations
