# Angular New Project

<div align="center">

**A Clean, Performance-Focused Angular 18 Sandbox Demonstrating Modern Features**

[![Angular](https://img.shields.io/badge/Angular-18.1-DD0031?style=for-the-badge&logo=angular)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![SSR](https://img.shields.io/badge/SSR-Enabled-005CBB?style=for-the-badge&logo=express)](https://angular.dev/guide/ssr)
[![Standalone](https://img.shields.io/badge/Standalone-Components-green.svg?style=for-the-badge)](https://angular.dev/guide/components)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

[Live Demo](#) • [Report Bug](https://github.com/yourusername/angular-newProject/issues) • [Request Feature](https://github.com/yourusername/angular-newProject/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Performance & Architectural Highlights](#performance--architectural-highlights)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Component Communication & Sandbox Modes](#component-communication--sandbox-modes)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Angular New Project** is a modern, lightweight Angular 18 sandbox application designed to explore and demonstrate core concepts of the framework. It acts as an interactive development playground showing how standalone components interact, use content projection, manage lifecycles, and render on the server side using Server-Side Rendering (SSR).

This repository is optimized for learning and experimentation, highlighting clean architecture, component isolation, and reactive programming principles.

---

## Features

### 🚀 Core Features
- **Standalone Architecture**: Zero `NgModule` overhead, leveraging direct component imports for faster compilation and better tree-shaking.
- **Multi-Slot Content Projection**: Dynamic HTML projection from a parent component to specific slots in a child component using `<ng-content>` selectors.
- **Component Interaction Playground**: Ready-to-use boilerplate for parent-to-child queries and child-to-parent events.
- **Server-Side Rendering (SSR)**: Full integration with `@angular/ssr` and Express for lightning-fast initial page loads and superior SEO.
- **Built-in Pipes**: Declarative data formatting showcasing direct template integration of `DatePipe` and `UpperCasePipe`.

---

## Tech Stack

### Core Technologies
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Angular** | 18.1.0 | Frontend Framework |
| **TypeScript** | 5.5.2 | Type-safe Development |
| **RxJS** | 7.8.0 | Reactive Programming |
| **Express** | 4.18.2 | Web Server for Server-Side Rendering |
| **@angular/ssr** | 18.1.1 | SSR & Pre-rendering Library |

### Build & Development Tools
- **Angular CLI**: 18.1.1
- **Node.js**: 18.x / 20.x / 22.x
- **npm**: 10.x+

---

## Performance & Architectural Highlights

The application is structured to ensure high performance and clean code design:

### ⚡ Standalone Components
By utilizing standalone components, each view defines its own dependencies explicitly. This prevents bloating the application bundles and guarantees that only the necessary component modules are compiled.

### 🌐 Server-Side Rendering (SSR) & Hydration
- Enabled via **Express** and `@angular/ssr`.
- Initial pages are rendered to HTML on the server side and sent to the client, where Angular hydrates the page seamlessly, increasing SEO visibility and performance.

### 🎯 Custom Content Projection
Uses dedicated structural selector definitions (`[question]` and `[answer]`) inside the child component. This allows the parent component to pass custom layout blocks without writing custom rendering logic.

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 10.x or higher
- **Angular CLI** 18.1.1 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/angular-newProject.git
   cd angular-newProject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   ```
   Navigate to http://localhost:4200/
   ```

The app will automatically reload when you make changes to the source files.

---

## Project Structure

```
angular-newProject/
├── src/
│   ├── app/
│   │   ├── child/                     # Presentation component for content projection
│   │   │   ├── child.component.css
│   │   │   ├── child.component.html   # Defines target slots with <ng-content>
│   │   │   ├── child.component.spec.ts
│   │   │   └── child.component.ts     # Declares EventEmitters and Output handlers
│   │   ├── parent/                    # Host component demonstrating communication
│   │   │   ├── parent.component.css
│   │   │   ├── parent.component.html  # Projects custom markup into child component
│   │   │   ├── parent.component.spec.ts
│   │   │   └── parent.component.ts    # Houses @ViewChild references
│   │   ├── app.component.css
│   │   ├── app.component.html         # Embeds parent component & pipes
│   │   ├── app.component.ts           # Root component bootstrapping parent & pipes
│   │   ├── app.config.ts              # Client config & Router configuration
│   │   └── app.config.server.ts       # Server config for Server-Side Rendering
│   ├── main.server.ts                 # Server-side bootstrap entry point
│   ├── main.ts                        # Client-side bootstrap entry point
│   ├── styles.css                     # Global stylesheets
│   └── index.html                     # Main HTML file
├── server.ts                          # Express server setup for Angular SSR
├── angular.json                       # Angular CLI workspace config
├── package.json                       # Project dependencies and npm scripts
├── tsconfig.json                      # Workspace TypeScript configuration
└── README.md                          # This file
```

---

## Available Scripts

### Development
```bash
npm start              # Runs the development server at http://localhost:4200
npm run watch          # Runs the build in watch mode for development
npm test               # Runs unit tests via Karma
```

### SSR and Production Build
```bash
npm run build          # Compiles both client and server applications for production
npm run serve:ssr:angular-newProject # Runs the node server to serve SSR application locally
```

---

## Component Communication & Sandbox Modes

To make it easy to experiment with different Angular mechanisms, parts of the codebase contain commented snippets that can be activated as needed:

### 📥 1. Content Projection Mode (Active)
Demonstrates passing HTML nodes from parent to child. Look at:
- **Parent:** [parent.component.html](./src/app/parent/parent.component.html)
- **Child:** [child.component.html](./src/app/child/child.component.html)

### 💬 2. Event Emitter Mode (Playground)
To test child-to-parent communication:
1. Open [child.component.ts](./src/app/child/child.component.ts) and uncomment `sendMessage() { ... }` and `messageEvent`.
2. Open [child.component.html](./src/app/child/child.component.html) and uncomment the `<button>` trigger.
3. Open [parent.component.html](./src/app/parent/parent.component.html) and swap comment states to bind `(messageEvent)="reciveMessage($event)"`.
4. Open [parent.component.ts](./src/app/parent/parent.component.ts) and uncomment `reciveMessage(msg)`.

### 🔍 3. ViewChild DOM Querying (Playground)
To inspect child properties directly from parent component TS:
1. Open [parent.component.ts](./src/app/parent/parent.component.ts) and uncomment `ngAfterViewInit()` and import `AfterViewInit`.
2. Open [child.component.ts](./src/app/child/child.component.ts) and uncomment the `message` field.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **Angular Team**: For the outstanding modern framework.
- **Express Team**: For the lightweight web application framework powering our SSR server.
- **Shields.io**: For the beautiful badges.

---

<div align="center">

**Made with ❤️ using Angular 18**

[⬆ Back to Top](#angular-new-project)

</div>
