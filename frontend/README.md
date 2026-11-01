# TalentFlow frontend

This React application is built with Vite and connects to the TalentFlow Django API.

## Run locally

From this directory, install packages and start the development server:

```powershell
npm install
npm run dev
```

Open the local address printed by Vite. The API base URL is currently `http://127.0.0.1:8000/api` in `src/services/api.js`; change it there when the backend uses a different host or port.

## Available scripts

```powershell
npm run dev      # Start Vite in development mode
npm run lint     # Check source with Oxlint
npm run build    # Create a production build in dist/
npm run preview  # Preview the production build
```

Start the backend before signing in or loading recruitment records. See the repository [README](../../README.md) for backend setup and the candidate-to-offer workflow.
