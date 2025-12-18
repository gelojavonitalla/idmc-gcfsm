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

### Google Cloud APIs

The following Google Cloud APIs must be enabled in your GCP project for full functionality:

| API | Purpose | Required |
|-----|---------|----------|
| **Cloud Firestore API** | NoSQL database for storing event data, registrations, speakers, sessions, etc. | ✅ Yes |
| **Firebase Authentication API** | User authentication for admin dashboard access | ✅ Yes |
| **Cloud Storage API** | File storage for images, videos, and payment proof uploads | ✅ Yes |
| **Cloud Functions API** | Serverless backend for email notifications, OCR, and scheduled tasks | ✅ Yes |
| **Cloud Vision API** | OCR processing for payment receipt verification | ✅ Yes |
| **Secret Manager API** | Secure storage for sensitive API keys (e.g., SendGrid) | ✅ Yes |
| **Cloud Scheduler API** | Scheduled execution of cleanup tasks (auto-cancel expired registrations) | ✅ Yes |
| **Cloud Build API** | Required for deploying Cloud Functions | ✅ Yes |
| **Artifact Registry API** | Required for Cloud Functions deployment | ✅ Yes |

#### Enabling APIs via gcloud CLI

```bash
# Set your project
gcloud config set project idmc-gcfsm-dev

# Enable all required APIs
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

#### Enabling APIs via Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (`idmc-gcfsm-dev`)
3. Navigate to **APIs & Services** > **Library**
4. Search for and enable each API listed above

#### Secret Manager Setup

The following secrets must be configured in Secret Manager:

| Secret Name | Description |
|-------------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key for sending registration and ticket confirmation emails |

```bash
# Create the SendGrid API key secret
echo -n "your-sendgrid-api-key" | gcloud secrets create SENDGRID_API_KEY --data-file=-

# Grant Cloud Functions access to the secret
gcloud secrets add-iam-policy-binding SENDGRID_API_KEY \
  --member="serviceAccount:idmc-gcfsm-dev@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Project Structure

```
idmc-gcfsm/
├── docs/                    # Documentation
│   ├── epics/              # Product epics and requirements
│   ├── coding_standard.md  # Coding standards
│   └── UNIT_TESTING.md     # Unit testing guide
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
| [Unit Testing Guide](./docs/UNIT_TESTING.md) | Testing patterns, mocking strategies, and best practices |
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
