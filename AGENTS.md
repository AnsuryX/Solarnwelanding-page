# AGENTS.md

## Project Overview
Solargear Kenya is an AI-powered solar installation landing page and quote estimator for Nairobi homes. Built with React + TypeScript frontend and Express backend, integrating Google Gemini API for personalized solar recommendations.

## Build & Run
See [README.md](README.md) for basic setup and environment variables.

Key commands:
- `npm run dev`: Start local development server (Express + Vite HMR)
- `npm run build`: Build for production
- `npm run start`: Run production server

## Architecture
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS with custom green/amber theme
- **Backend**: Express.js serving /api/estimate endpoint with Vite middleware in dev
- **AI Integration**: Google Gemini 2.0 Flash with fallback to OpenRouter API
- **Database**: Supabase PostgreSQL for lead tracking
- **Deployment**: Dual support for Node.js server and Cloudflare Workers

## Key Conventions
- **AI Fallback Chain**: Primary Gemini → Secondary OpenRouter → 503 error. Keep `server.ts` and `functions/api/estimate.js` synchronized.
- **Environment Variables**: GEMINI_API_KEY (required), VITE_API_URL (dev/prod), OPENROUTER_API_KEY (optional fallback)
- **Regional Customization**: 12 Kenyan regions, KES currency, location-specific AI prompts
- **Lead Capture**: Formspree for forms, Supabase for tracking (insert into `leads` table, not `recent_leads` view)
- **Retry Logic**: Exponential backoff (1s, 2s, 4s) for 503/429 errors

## Common Pitfalls
- Always update both `server.ts` and `functions/api/estimate.js` when changing AI logic
- Set VITE_API_URL correctly to avoid double-slashes in API calls
- WhatsApp redirects may fail in iframe contexts (AI Studio); fallback gracefully
- Supabase RLS policies require inserting into base `leads` table

## Essential Files
- [App.tsx](src/App.tsx): Monolithic UI component with all sections
- [server.ts](server.ts): Express API with AI estimation logic
- [geminiService.ts](src/services/geminiService.ts): Frontend AI service with retry wrapper
- [supabase_schema.sql](supabase_schema.sql): Database schema and RLS policies</content>
<parameter name="filePath">AGENTS.md