# GEMINI.md

## Project Overview
**MyLink** is a web application designed to showcase a personal profile or a "link-in-bio" style landing page. The core application is located in the `my-profile` directory and is built using the latest Next.js features.

### Tech Stack
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Library:** [React](https://react.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Linter:** [ESLint](https://eslint.org/)

## Directory Structure
- `my-profile/`: The main Next.js application directory.
  - `app/`: Contains the application routes, layouts, and global styles.
  - `public/`: Static assets such as images and SVGs.
  - `package.json`: Project dependencies and scripts.
  - `tsconfig.json`: TypeScript configuration.
  - `next.config.ts`: Next.js specific configuration.

## Getting Started

### Prerequisites
- Node.js (version 18.17 or later recommended)
- npm, yarn, pnpm, or bun

### Building and Running
All commands should be executed within the `my-profile` directory:

```bash
cd my-profile

# Install dependencies
npm install

# Start the development server
npm run dev

# Build the application for production
npm run build

# Start the production server
npm run start

# Run linting checks
npm run lint
```

## Development Conventions
- **App Router:** Use the `app/` directory for routing. Components should be Server Components by default; use `'use client'` only when interactivity or browser APIs are required.
- **Styling:** Use Tailwind CSS utility classes for styling. Tailwind 4 is configured, which simplifies the CSS setup.
- **TypeScript:** Strict type checking is enabled. Ensure all new components and functions are properly typed.
- **Formatting:** Adhere to the project's ESLint configuration for code style consistency.
