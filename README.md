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
