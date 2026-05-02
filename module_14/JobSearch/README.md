# Job Search Assistant

Full-stack React + TypeScript and Node + Express app for Assignment 14. The app searches jobs with JSearch through RapidAPI, ranks jobs by resume keyword match, filters by employment type, and generates cover letters through the backend.

## Setup

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
cd ..
```

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Set `RAPIDAPI_KEY` in `backend/.env`. The backend runs on port `5050` by default because macOS often reserves port `5000`.

To use OpenAI for cover letters, provide `OPENAI_API_KEY` as a shell environment variable before starting the app:

```bash
export OPENAI_API_KEY=your_openai_key
```

## Run

Start frontend and backend together:

```bash
npm start
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5050`

Press `Ctrl+C` to stop both servers.

## Scripts

```bash
npm start
npm run dev
npm run build
npm run lint
```
