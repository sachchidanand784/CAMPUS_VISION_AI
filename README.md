# CampusVisionAI

CampusVisionAI is a smart AI-based attendance system designed for college campuses. It utilizes facial recognition and a seamless React frontend to eliminate manual attendance overhead, track student punctuality, and automatically enforce administrative policies like late warnings and blocks.

## Project Structure

- `BACKEND/`: FastAPI application containing all models, API endpoints, business logic, and serverless Vercel configuration.
- `FRONTEND/`: React Vite application containing the Student Dashboard, Admin Controls, Live Gate monitor, and Netlify deployment configuration.

## Features Built
- ✅ **Facial Recognition Gate Entry:** Compare webcam captures securely with cloud-stored images via AI.
- ✅ **Role-based Dashboards:** Dedicated panels for Admins and Students to view status and logs.
- ✅ **Automated Discipline Engine:** Built-in logic to handle 3-strike warnings and 5-strike automatic campus blocks.
- ✅ **Secure Authentication:** Robust JWT-based security and password hashing.
- ✅ **Premium UI/UX:** A stunning, modern interface with beautiful animations and a custom "White & Blue" design system.

## Setup Instructions

### Backend Local Run
1. `cd BACKEND`
2. Create virtualenv: `python -m venv venv` and activate it.
3. Install dependencies: `pip install -r requirements.txt`
4. Start Server: `uvicorn main:app --reload`
> Ensure `DATABASE_URL` is set to your Supabase instance, or it will default to a local SQLite database for quick testing.

### Frontend Local Run
1. `cd FRONTEND`
2. Install dependencies: `npm install`
3. Start Dev Server: `npm run dev`

### Production Deployment
- **Backend**: Deployed to Vercel via the `vercel.json` config. Just connect the `BACKEND` directory on the Vercel dashboard.
- **Frontend**: Deployed to Netlify via the `netlify.toml` config. Connect the `FRONTEND` directory on the Netlify dashboard.
