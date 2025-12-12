# IDMC Event Management Platform

> **Intentional Disciplemaking Church (IDMC) Conference Event Management Platform**

A comprehensive event management system for the annual IDMC Conference in Singapore. Built with React and Firebase, this platform enables conference organizers to manage registrations, speakers, schedules, workshops, and attendee check-in.

## Overview

The IDMC Conference is an annual disciplemaking conference held at Singapore EXPO, featuring plenary sessions, workshops, and ministry showcases. This platform provides:

- **Public Website**: Landing page, speakers, schedule, registration, FAQ
- **Admin Dashboard**: Content management, attendee management, analytics
- **Check-in System**: QR code scanning for event-day operations

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Backend**: Firebase Cloud Functions (Node.js 22)
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Hosting**: Firebase Hosting
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js v20+
- pnpm (recommended) or npm
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

```bash
# Clone the repository
git clone https://github.com/gelojavonitalla/idmc-gcfsm.git
cd idmc-gcfsm

# Install dependencies
pnpm install

# Install functions dependencies
cd functions && pnpm install && cd ..

# Start development server
pnpm start
```

### Firebase Setup

```bash
# Login to Firebase
firebase login

# Select project
firebase use idmc-gcfsm-dev
```

## Project Structure

```
idmc-gcfsm/
├── docs/                    # Documentation
│   ├── epics/              # Product epics and requirements
│   └── coding_standard.md  # Coding standards
├── functions/              # Firebase Cloud Functions
│   └── src/
├── public/                 # Static assets
├── src/                    # React application
├── CLAUDE.md              # AI assistant guidelines
├── firebase.json          # Firebase configuration
└── README.md
```

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | Development guidelines for AI assistants |
| [Coding Standards](./docs/coding_standard.md) | Code style, patterns, and best practices |
| [IDMC Event Epic](./docs/epics/IDMC-EVT-Event-Management-v1.md) | Product requirements and specifications |

## Epic Milestones

The platform is organized into the following milestones:

| ID | Milestone | Description |
|----|-----------|-------------|
| IDMC-EVT-01 | Public Website & Landing Page | Conference homepage with theme, dates, CTA |
| IDMC-EVT-02 | Registration & Ticketing | Multi-tier registration with payment flow |
| IDMC-EVT-03 | Speaker Management | Speaker profiles, bios, session assignments |
| IDMC-EVT-04 | Schedule & Sessions | Day-by-day program with plenary sessions |
| IDMC-EVT-05 | Workshops & Tracks | Workshop tracks with capacity management |
| IDMC-EVT-06 | FAQ & Information Pages | FAQ, about, contact, venue information |
| IDMC-EVT-07 | Admin Dashboard | Analytics, content management, settings |
| IDMC-EVT-08 | Past Conferences Archive | Historical conference data and galleries |
| IDMC-EVT-09 | Attendee Management | Registration list, search, export, comms |
| IDMC-EVT-10 | Check-in & Access Control | QR scanning, manual lookup, real-time stats |

## Available Scripts

```bash
# Development
pnpm start              # Run development server
pnpm run build          # Build for production

# Testing
pnpm test               # Run tests
pnpm run lint           # Run ESLint

# Firebase
pnpm run deploy         # Deploy to Firebase
firebase emulators:start # Run local emulators
```

## Deployment

The project uses GitHub Actions for CI/CD:

- **Pull Requests**: Preview deployments
- **Merge to main**: Production deployment

## Contributing

1. Create a feature branch: `git checkout -b feature/description`
2. Make changes following [Coding Standards](./docs/coding_standard.md)
3. Run lint and tests: `pnpm run lint && pnpm test`
4. Commit with descriptive message
5. Push and create Pull Request

## License

Private - IDMC Singapore / Covenant Evangelical Free Church

## Links

- [IDMC Conference Website](https://www.idmc.org.sg/)
- [Firebase Console](https://console.firebase.google.com/project/idmc-gcfsm-dev)
