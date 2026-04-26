# HealthSense AI

HealthSense AI is now a real full-stack starter project with:

- React frontend with a soothing dashboard-style UI
- Flask backend API
- SQLite storage for users and prediction history
- Persistent registration and login
- Email OTP verification
- Forgot password and reset password with OTP
- Symptom-based disease prediction
- Diet recommendation
- Doctor recommendation
- Appointment booking
- Gemini-powered AI assistant chat
- Admin dashboard
- Registration confirmation email support
- Prediction result email support

## Project structure

- Frontend: [src](/Users/ritikpandey/Desktop/2%20may%20Proje%20t/src)
- Backend: [app.py](/Users/ritikpandey/Desktop/2%20may%20Proje%20t/app.py)
- ML dataset: [data/disease_dataset.csv](/Users/ritikpandey/Desktop/2%20may%20Proje%20t/data/disease_dataset.csv)
- Database file: `app.db`

## Install dependencies

1. Create a virtual environment:

   ```bash
   python3 -m venv .venv
   ```

2. Python packages:

   ```bash
   .venv/bin/pip install -r requirements.txt
   ```

3. Node packages:

   ```bash
   npm install
   ```

## Run in development

Open two terminals in the project folder.

1. Start the Flask backend:

   ```bash
   npm run backend
   ```

2. Start the React frontend:

   ```bash
   npm run dev
   ```

3. Open the Vite URL shown in the terminal.

The React app uses the Vite proxy to call the Flask API at `http://127.0.0.1:5000`.

## Main pages

- `/register`
- `/verify-email`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/predict`
- `/history`
- `/appointments`
- `/admin` for admin users

## Admin access

- The first registered user becomes the admin by default.
- You can also set `ADMIN_EMAIL` to force a specific email to become admin during registration.

## Deploy on Render

This repo now includes [render.yaml](/Users/ritikpandey/Desktop/2%20may%20Proje%20t/render.yaml) for Render deployment.

Important:

- The app uses SQLite, so deployment should use a persistent disk or a different database.
- Render's filesystem is ephemeral by default, and Render documents that persistent data requires either a persistent disk or a managed datastore.

Recommended Render path:

1. Push this project to GitHub.
2. In Render, create a new `Web Service`.
3. Choose `Docker` as the runtime so both React and Flask build inside one image.
4. Render will automatically use the [Dockerfile](/Users/ritikpandey/Desktop/2%20may%20Proje%20t/Dockerfile).
5. Attach a persistent disk if you want SQLite data to survive deploys and restarts.
   - Mount path: `/app/data-store`
6. Add environment variables for email:
   - `MAIL_SERVER`
   - `MAIL_PORT`
   - `MAIL_USERNAME`
   - `MAIL_PASSWORD`
   - `MAIL_FROM`
   - `MAIL_USE_TLS`
   - `GEMINI_API_KEY`
   - optional `GEMINI_MODEL` such as `gemini-2.5-flash`
   - optional `ADMIN_EMAIL`
7. Add `SECRET_KEY`
8. Deploy and open the generated Render URL.

## Production-style local run

1. Build the React app:

   ```bash
   npm run build
   ```

2. Start Flask:

   ```bash
   npm run backend
   ```

3. Open `http://127.0.0.1:5000`

Flask will serve the built React app from the `dist` folder.

## Email setup

Set these environment variables before starting the backend if you want real email delivery:

```bash
export SECRET_KEY="change-this"
export MAIL_SERVER="smtp.gmail.com"
export MAIL_PORT="587"
export MAIL_USERNAME="your-email@gmail.com"
export MAIL_PASSWORD="your-app-password"
export MAIL_FROM="your-email@gmail.com"
export MAIL_USE_TLS="true"
export GEMINI_API_KEY="your-gemini-api-key"
export GEMINI_MODEL="gemini-2.5-flash"
```

If SMTP is not configured, the app still works and simulates email sending in the backend logs.

If `GEMINI_API_KEY` is not configured, the AI assistant page will load but chat requests will return a configuration message.

## Important note

This project is suitable for a student or portfolio project. The ML prediction is a lightweight demonstration model and is not a substitute for medical diagnosis.
