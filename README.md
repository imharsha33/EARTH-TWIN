# 🌍 Earth Twin

A 3D Earth simulation and data visualization platform built with React, Three.js, and TypeScript.

## Tech Stack

- **React 18** with TypeScript
- **Three.js / React Three Fiber** for 3D Earth rendering
- **Vite** for development and bundling
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **Framer Motion** for animations
- **React Router DOM** for navigation
- **Radix UI / shadcn** component library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Run Tests

```bash
npm test
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── EarthGlobe.tsx
│   ├── DataDashboard.tsx
│   ├── SimControls.tsx
│   └── ui/           # shadcn/radix base components
├── pages/            # Application pages
│   ├── LandingPage.tsx
│   ├── SimulationPage.tsx
│   ├── ReportPage.tsx
│   └── Index.tsx
├── lib/              # Utility and simulation logic
│   ├── simulation.ts
│   └── utils.ts
└── hooks/            # Custom React hooks
```

## License

MIT
