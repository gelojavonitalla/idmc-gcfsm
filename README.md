# IDMC Event Management Platform

> **Intentional Disciplemaking Church (IDMC) Conference Event Management Platform**

A comprehensive event management system for the annual IDMC Conference in Singapore. Built with React and Firebase, this platform enables conference organizers to manage registrations, speakers, schedules, workshops, and attendee check-in.

## Overview

The IDMC Conference is an annual disciplemaking conference held at Singapore EXPO, featuring plenary sessions, workshops, and ministry showcases. This platform provides:

- **Public Website**: Landing page, speakers, schedule, registration, FAQ, venue information
- **Admin Dashboard**: Content management, attendee management, analytics, financial tracking
- **Check-in System**: QR code scanning and real-time monitoring for event-day operations
- **Finance Module**: Payment verification with OCR, invoicing, and financial reporting

## Features

### Public Pages

| Feature | Description |
|---------|-------------|
| **Homepage** | Landing page with countdown timer, conference highlights, and registration CTA |
| **Speakers** | Speaker profiles with photos, bios, and session assignments |
| **Schedule** | Interactive schedule with day-by-day program and session details |
| **Registration** | Multi-step registration form with tier-based pricing |
| **Workshops** | Workshop selection with track descriptions and capacity info |
| **FAQ** | Searchable FAQs organized by category |
| **Venue** | Interactive floor plan with room details |
| **Downloads** | Resource downloads for registered attendees |

### Admin Dashboard

| Module | Description |
|--------|-------------|
| **Dashboard** | Analytics overview with registration stats and charts |
| **Registrations** | View, filter, export attendees with payment status tracking |
| **Check-in** | QR code scanner with manual lookup fallback |
| **Check-in Monitor** | Real-time check-in statistics and attendance tracking |
| **Speakers** | CRUD operations for speaker profiles |
| **Schedule** | Session and program management |
| **Workshops** | Workshop content and capacity management |
| **FAQ** | Content management for FAQs |
| **Venue** | Floor plan and room configuration |
| **Finance** | Revenue tracking, payment verification, invoice management |
| **Users** | Admin user management with role-based permissions |
| **Activity Log** | Audit trail of all admin actions |
| **Settings** | Global configuration (registration tiers, deadlines, etc.) |

### Key Capabilities

- **Multi-tier Pricing**: Super Early Bird, Early Bird, Regular pricing tiers
- **Category-based Registration**: Regular, Student, NSF with verification workflow
- **Payment Verification**: OCR-powered receipt scanning with Google Cloud Vision
- **QR Code Tickets**: Automated ticket generation and email delivery
- **Role-based Access Control**: 5 admin roles (superadmin, admin, finance, media, volunteer)
- **Email Notifications**: SendGrid integration for transactional emails
- **Export Capabilities**: CSV and PDF export for attendee lists and reports

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, JavaScript/JSX, CSS Modules, React Router v6 |
| **Backend** | Firebase Cloud Functions (Node.js 22, TypeScript) |
| **Database** | Cloud Firestore (NoSQL) |
| **Storage** | Firebase Storage |
| **Authentication** | Firebase Authentication |
| **Hosting** | Firebase Hosting |
| **Email** | SendGrid API |
| **OCR** | Google Cloud Vision API, Tesseract.js |
| **CI/CD** | GitHub Actions |

### Key Libraries

- **QR Code**: `qrcode.react`, `html5-qrcode` (scanner)
- **PDF Generation**: `jspdf`, `jspdf-autotable`
- **Charts**: `recharts`
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js v20+
- pnpm (required - do not use npm or yarn)
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

# Copy environment variables
cp .env.example .env.local

# Start development server
pnpm start
```

### Firebase Setup

```bash
# Login to Firebase
firebase login

# Select project
firebase use idmc-gcfsm-dev

# Start local emulators (optional)
firebase emulators:start
```

## Project Structure

```
idmc-gcfsm/
├── src/                          # React frontend application
│   ├── components/               # Reusable UI components
│   │   ├── admin/               # Admin-specific components
│   │   ├── layout/              # Header, Footer, Layout
│   │   ├── auth/                # Authentication & protected routes
│   │   ├── schedule/            # Schedule display components
│   │   ├── workshops/           # Workshop selection
│   │   ├── speakers/            # Speaker components
│   │   ├── venue/               # Floor plan visualization
│   │   ├── faq/                 # FAQ accordion & search
│   │   ├── checkin/             # QR scanner components
│   │   └── ui/                  # Generic UI components
│   ├── pages/                    # Page components (routes)
│   │   ├── admin/               # Admin pages (23 pages)
│   │   └── [public pages]       # Public-facing pages
│   ├── services/                 # Firebase service functions
│   ├── context/                  # React Context providers
│   ├── lib/                      # Library utilities
│   ├── constants/                # Application constants
│   ├── utils/                    # Helper functions
│   ├── tesseract/                # OCR processing
│   └── App.js                    # Main router
├── functions/                    # Firebase Cloud Functions
│   ├── src/index.ts             # Cloud Function definitions
│   └── lib/                     # Compiled output
├── docs/                         # Documentation
│   ├── epics/                   # Product requirements (10 epics)
│   ├── coding_standard.md       # Code style guide
│   ├── UNIT_TESTING.md          # Testing guide
│   └── PR_TEMPLATE.md           # PR checklist
├── scripts/                      # Seeding & maintenance scripts
├── public/                       # Static assets
├── firebase.json                 # Firebase configuration
├── firestore.indexes.json        # Firestore composite indexes
├── firestore.rules               # Firestore security rules
└── storage.rules                 # Storage security rules
```

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id

# Optional: Emulator Configuration
REACT_APP_USE_EMULATOR=false
```

## Google Cloud APIs

The following APIs must be enabled in your GCP project:

| API | Purpose | Required |
|-----|---------|----------|
| **Cloud Firestore API** | NoSQL database for all event data | Yes |
| **Firebase Authentication API** | User authentication | Yes |
| **Cloud Storage API** | File storage for images and uploads | Yes |
| **Cloud Functions API** | Serverless backend | Yes |
| **Cloud Vision API** | OCR for payment receipt verification | Yes |
| **Secret Manager API** | Secure API key storage | Yes |
| **Cloud Scheduler API** | Scheduled task execution | Yes |
| **Cloud Build API** | Cloud Functions deployment | Yes |
| **Artifact Registry API** | Cloud Functions deployment | Yes |

### Enable APIs via CLI

```bash
gcloud config set project idmc-gcfsm-dev

gcloud services enable \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com \
  storage.googleapis.com \
  cloudfunctions.googleapis.com \
  vision.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

### Secret Manager Setup

```bash
# Create SendGrid API key secret
echo -n "your-sendgrid-api-key" | gcloud secrets create SENDGRID_API_KEY --data-file=-

# Grant Cloud Functions access
gcloud secrets add-iam-policy-binding SENDGRID_API_KEY \
  --member="serviceAccount:idmc-gcfsm-dev@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Available Scripts

### Development

```bash
pnpm start              # Run development server
pnpm run dev            # Alias for start
pnpm run build          # Build for production
```

### Testing & Quality

```bash
pnpm run lint           # Run ESLint
pnpm run lint:fix       # Auto-fix lint issues
pnpm run typecheck      # TypeScript type checking
pnpm test               # Run unit tests
pnpm run test:coverage  # Tests with coverage report
```

### Data Seeding

```bash
pnpm run seed:speakers      # Seed speaker data
pnpm run seed:sessions      # Seed session data
pnpm run seed:schedule      # Seed schedule
pnpm run seed:faq           # Seed FAQ data
pnpm run seed:settings      # Seed settings
pnpm run seed:venue         # Seed venue data
pnpm run seed:registrations # Generate test registrations
pnpm run seed:all           # Run all seed scripts
```

### Firebase

```bash
pnpm run deploy             # Deploy to Firebase
firebase emulators:start    # Run local emulators
```

## Cloud Functions

The backend includes the following Cloud Functions:

| Function | Trigger | Description |
|----------|---------|-------------|
| `onAdminCreated` | Firestore | Sends invitation email when admin is created |
| `onRegistrationCreated` | Firestore | Sends confirmation email with payment instructions |
| `onPaymentConfirmed` | Firestore | Sends ticket email with QR code |
| `cancelExpiredRegistrations` | Scheduled | Auto-cancels unpaid registrations |
| `syncConferenceStats` | Scheduled | Synchronizes conference statistics |
| `ocrReceipt` | Callable | OCR processing for payment receipts |
| `sendInvoiceEmail` | Callable | Sends official invoice receipts |
| `sendInquiryReply` | Callable | Sends contact inquiry responses |

## Epic Milestones

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

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | Development guidelines for AI assistants |
| [Coding Standards](./docs/coding_standard.md) | Code style, patterns, and best practices |
| [Unit Testing Guide](./docs/UNIT_TESTING.md) | Testing patterns and mocking strategies |
| [Registration Schema](./docs/REGISTRATION_SCHEMA.md) | Registration data structure |
| [PR Template](./docs/PR_TEMPLATE.md) | Pull request checklist |

## Deployment

The project uses GitHub Actions for CI/CD:

- **Pull Requests**: Automated linting, type checking, and tests
- **Merge to main**: Production deployment to Firebase Hosting

### Manual Deployment

```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions
```

## Contributing

1. Create a feature branch: `git checkout -b feature/description`
2. Make changes following [Coding Standards](./docs/coding_standard.md)
3. Run verification:
   ```bash
   pnpm run lint
   pnpm run typecheck
   pnpm test
   pnpm run build
   ```
4. Commit with descriptive message
5. Push and create Pull Request

## Troubleshooting

### `pnpm install` fails

```bash
pnpm store prune
rm -rf node_modules
pnpm install
```

### Type errors in imports

Rebuild if needed:
```bash
pnpm run build
```

### Firebase emulator issues

Ensure Java is installed (required for Firestore emulator):
```bash
java -version
```

## License

Private - IDMC Singapore / Covenant Evangelical Free Church

## Links

- [IDMC Conference Website](https://www.idmc.org.sg/)
- [Firebase Console](https://console.firebase.google.com/project/idmc-gcfsm-dev)
