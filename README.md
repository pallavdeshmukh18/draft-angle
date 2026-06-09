# Draft Angle Advisor

A deployment-ready full-stack app for aluminum pressure die casting draft-angle recommendations.

## Stack

- Backend: Node.js, Express, MongoDB, Mongoose
- Frontend: Vite, React
- LLM assistance: Groq API, with a deterministic fallback if the key is not set

## Project Layout

- `backend/` Express API and MongoDB persistence
- `frontend/` React UI built with Vite

## Setup

1. Create env files from the examples:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env`
2. Install dependencies in each folder:
   - `cd backend && npm i`
   - `cd ../frontend && npm i`
3. Start the backend:
   - `npm run dev`
4. Start the frontend:
   - `npm run dev`

## API

- `POST /api/recommend-draft`
- `GET /api/recommendations`
- `GET /api/health`

## Environment Variables

Backend:

- `PORT`
- `MONGODB_URI`
- `CLIENT_URL`
- `GROQ_API_KEY`
- `GROQ_MODEL`

Frontend:

- `VITE_API_BASE_URL`

## Deployment Notes

- Keep the backend and frontend hosted separately.
- Set the frontend API base URL through `VITE_API_BASE_URL` at build time.
- Set the backend connection strings and Groq key through environment variables only.
- The provided Dockerfiles can be used to build container images for both services.
