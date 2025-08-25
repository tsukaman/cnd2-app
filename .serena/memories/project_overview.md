# CND² (CND Squared) Project Overview

## Purpose
CND² is a compatibility diagnosis application for CloudNative Days Winter 2025 (November 18-19). The app uses Prairie Card profiles to calculate compatibility between conference participants, supporting both duo (2 people) and group (3-6 people) diagnosis modes.

## Tech Stack
- **Framework**: Next.js 15.5.0 with TypeScript
- **Styling**: Tailwind CSS v4 
- **Animations**: Framer Motion, Three.js
- **AI Integration**: OpenAI GPT-4o-mini API
- **Infrastructure**: Cloudflare Pages/Workers
- **Build Tool**: Turbopack
- **Package Manager**: npm

## Key Features
- Prairie Card profile integration for automatic profile fetching
- AI-powered compatibility diagnosis using GPT-4o-mini
- NFC/QR code support for result sharing
- Group diagnosis supporting 3-6 people
- Privacy-focused with automatic result deletion after 7 days
- Rich animations and interactive UI/UX

## Development URLs
- Development: http://localhost:3000 (or 3002 if port is in use)
- Production: https://cnd2.cloudnativedays.jp

## Project Structure
```
src/
├── app/            # Next.js app router pages
├── components/     # React components
├── config/         # Configuration files
├── hooks/          # Custom React hooks
├── lib/            # Utility libraries and business logic
├── styles/         # Global styles
└── types/          # TypeScript type definitions
```

## Environment Setup
Requires `.env.local` file with:
- `OPENAI_API_KEY`: OpenAI API key for GPT-4o-mini
- `NEXT_PUBLIC_APP_URL`: Application URL