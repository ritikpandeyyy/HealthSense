import os
import random
import sqlite3
from csv import DictReader
from datetime import datetime, timedelta
from pathlib import Path
from urllib import error as urllib_error
from urllib import request as urllib_request
import json

from flask import Flask, g, jsonify, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", DATA_DIR / "app.db"))
DATASET_PATH = BASE_DIR / "data" / "disease_dataset.csv"
DIST_DIR = BASE_DIR / "dist"
OTP_MINUTES = 10
RESET_MINUTES = 15
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

SYMPTOM_OPTIONS = [
    {"token": "fever", "label": "Fever"},
    {"token": "cough", "label": "Cough"},
    {"token": "sore_throat", "label": "Sore throat"},
    {"token": "fatigue", "label": "Fatigue"},
    {"token": "body_pain", "label": "Body pain"},
    {"token": "headache", "label": "Headache"},
    {"token": "nausea", "label": "Nausea"},
    {"token": "dizziness", "label": "Dizziness"},
    {"token": "thirst", "label": "Thirst"},
    {"token": "frequent_urination", "label": "Frequent urination"},
    {"token": "blurred_vision", "label": "Blurred vision"},
    {"token": "chest_pain", "label": "Chest pain"},
    {"token": "shortness_of_breath", "label": "Shortness of breath"},
    {"token": "abdominal_pain", "label": "Abdominal pain"},
    {"token": "vomiting", "label": "Vomiting"},
    {"token": "diarrhea", "label": "Diarrhea"},
    {"token": "joint_pain", "label": "Joint pain"},
    {"token": "skin_rash", "label": "Skin rash"},
    {"token": "wheezing", "label": "Wheezing"},
    {"token": "chills", "label": "Chills"},
    {"token": "dry_skin", "label": "Dry skin"},
    {"token": "constipation", "label": "Constipation"},
]

TOKEN_TO_LABEL = {item["token"]: item["label"] for item in SYMPTOM_OPTIONS}
LABEL_TO_TOKEN = {item["label"].lower(): item["token"] for item in SYMPTOM_OPTIONS}

DISEASE_META = {
    "Flu": {
        "diet": "Warm soup, citrus fruits, plenty of water, soft meals",
        "risk": "Moderate",
        "recovery": "3-5 days with rest and hydration",
        "specialist": "General Physician",
    },
    "Migraine": {
        "diet": "Hydration, light meals, almonds, bananas, magnesium-rich food",
        "risk": "Medium",
        "recovery": "Monitor triggers and rest in a dark room",
        "specialist": "Neurologist",
    },
    "Diabetes": {
        "diet": "High-fiber meals, oats, vegetables, low sugar diet",
        "risk": "High",
        "recovery": "Medical screening is strongly recommended",
        "specialist": "Endocrinologist",
    },
    "Heart Disease": {
        "diet": "Low-sodium meals, oats, berries, leafy greens",
        "risk": "High",
        "recovery": "Urgent clinical evaluation is recommended",
        "specialist": "Cardiologist",
    },
    "Food Poisoning": {
        "diet": "ORS, bananas, rice, toast, yogurt, simple fluids",
        "risk": "Medium",
        "recovery": "Hydrate well and monitor symptoms closely",
        "specialist": "Gastroenterologist",
    },
    "Arthritis": {
        "diet": "Omega-3 foods, turmeric, berries, leafy vegetables",
        "risk": "Medium",
        "recovery": "Follow up with long-term joint care guidance",
        "specialist": "Orthopedic Specialist",
    },
    "Allergy": {
        "diet": "Water, vitamin C foods, anti-inflammatory fruits and vegetables",
        "risk": "Low",
        "recovery": "Track likely triggers and reduce exposure",
        "specialist": "Allergist",
    },
    "Asthma": {
        "diet": "Warm fluids, vitamin D foods, apples, leafy vegetables",
        "risk": "High",
        "recovery": "Avoid triggers and consider urgent care if breathing worsens",
        "specialist": "Pulmonologist",
    },
    "Viral Infection": {
        "diet": "Warm soup, fluids, fruits, and protein-rich soft meals",
        "risk": "Moderate",
        "recovery": "Rest, hydrate, and monitor fever or fatigue",
        "specialist": "General Physician",
    },
    "Hypothyroidism": {
        "diet": "Iodine-rich foods, selenium sources, and balanced whole foods",
        "risk": "Medium",
        "recovery": "Medical thyroid testing is recommended",
        "specialist": "Endocrinologist",
    },
}

DOCTOR_DIRECTORY = [
    {"doctorName": "Dr. Aisha Mehra", "speciality": "General Physician", "hospital": "Serene Care Clinic", "city": "Remote / Online"},
    {"doctorName": "Dr. Kabir Khanna", "speciality": "Neurologist", "hospital": "Mindwell Hospital", "city": "Delhi"},
    {"doctorName": "Dr. Rohan Suri", "speciality": "Endocrinologist", "hospital": "Harmony Diabetes Center", "city": "Mumbai"},
    {"doctorName": "Dr. Meenal Rao", "speciality": "Cardiologist", "hospital": "Pulse Heart Institute", "city": "Bengaluru"},
    {"doctorName": "Dr. Nidhi Sharma", "speciality": "Gastroenterologist", "hospital": "Digestive Health Point", "city": "Pune"},
    {"doctorName": "Dr. Prateek Jain", "speciality": "Orthopedic Specialist", "hospital": "Motion Joint Care", "city": "Jaipur"},
    {"doctorName": "Dr. Sana Ali", "speciality": "Allergist", "hospital": "Breath & Allergy Studio", "city": "Hyderabad"},
    {"doctorName": "Dr. Varun Sen", "speciality": "Pulmonologist", "hospital": "Airway Health Center", "city": "Kolkata"},
]

app = Flask(__name__, static_folder=str(DIST_DIR / "assets"), static_url_path="/assets")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
app.config["JSON_SORT_KEYS"] = False


def now_iso():
    return datetime.now().isoformat()


def generate_code():
    return f"{random.randint(100000, 999999)}"


def parse_iso(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def ensure_columns(db, table_name, required_columns):
    existing_columns = {row["name"] for row in db.execute(f"PRAGMA table_info({table_name})").fetchall()}
    for column_name, column_type in required_columns.items():
        if column_name not in existing_columns:
            db.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")


def init_db():
    db = sqlite3.connect(DATABASE_PATH)
    db.row_factory = sqlite3.Row
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            symptoms TEXT NOT NULL,
            disease TEXT NOT NULL,
            diet_recommendation TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            prediction_id INTEGER,
            doctor_name TEXT NOT NULL,
            speciality TEXT NOT NULL,
            hospital TEXT NOT NULL,
            city TEXT NOT NULL,
            appointment_date TEXT NOT NULL,
            notes TEXT DEFAULT '',
            status TEXT DEFAULT 'Scheduled',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (prediction_id) REFERENCES predictions (id)
        );
        """
    )
    ensure_columns(
        db,
        "users",
        {
            "is_verified": "INTEGER DEFAULT 0",
            "verification_code": "TEXT DEFAULT ''",
            "verification_expiry": "TEXT DEFAULT ''",
            "reset_code": "TEXT DEFAULT ''",
            "reset_expiry": "TEXT DEFAULT ''",
            "role": "TEXT DEFAULT 'user'",
        },
    )
    ensure_columns(
        db,
        "predictions",
        {
            "confidence": "INTEGER DEFAULT 0",
            "risk_level": "TEXT DEFAULT ''",
            "recovery_note": "TEXT DEFAULT ''",
            "email_status": "TEXT DEFAULT ''",
        },
    )
    db.commit()
    db.close()


def load_dataset():
    with DATASET_PATH.open(newline="", encoding="utf-8") as csv_file:
        reader = DictReader(csv_file)
        return [
            {
                "symptoms": row["symptoms"].split(),
                "disease": row["disease"],
                "diet": row["diet"],
            }
            for row in reader
        ]


init_db()
DATASET = load_dataset()


def send_email(subject, recipient, body):
    api_key = os.getenv("SENDGRID_API_KEY")
    mail_from = os.getenv("MAIL_FROM", "noreply@example.com")

    if not api_key or not recipient:
        print(f"\n[Email simulation]\nTo: {recipient}\nSubject: {subject}\n\n{body}\n")
        return "Simulated"

    payload = json.dumps({
        "personalizations": [{"to": [{"email": recipient}]}],
        "from": {"email": mail_from},
        "subject": subject,
        "content": [{"type": "text/plain", "value": body}],
    }).encode("utf-8")
    req = urllib_request.Request(
        "https://api.sendgrid.com/v3/mail/send",
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    print(f"[Email] Sending '{subject}' to {recipient} via SendGrid...")
    try:
        with urllib_request.urlopen(req, timeout=15) as response:
            response.read()
        print(f"[Email] Delivered '{subject}' to {recipient}")
        return "Delivered"
    except urllib_error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        print(f"[Email] Failed to deliver '{subject}' to {recipient}: {exc.code} {detail or exc.reason}")
        return "Failed"
    except Exception as exc:
        print(f"[Email] Failed to deliver '{subject}' to {recipient}: {exc}")
        return "Failed"


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return get_db().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def require_login():
    user = get_current_user()
    if not user:
        return None, (jsonify({"ok": False, "message": "Please log in first."}), 401)
    return user, None


def require_admin():
    user, error = require_login()
    if error:
        return None, error
    if user["role"] != "admin":
        return None, (jsonify({"ok": False, "message": "Admin access is required."}), 403)
    return user, None


def serialize_user(user_row):
    return {
        "id": user_row["id"],
        "name": user_row["full_name"],
        "email": user_row["email"],
        "joinedAt": user_row["created_at"],
        "isVerified": bool(user_row["is_verified"]),
        "role": user_row["role"],
    }


def serialize_prediction(prediction_row):
    symptom_tokens = [item.strip() for item in prediction_row["symptoms"].split(",") if item.strip()]
    symptoms = [TOKEN_TO_LABEL.get(token, token.replace("_", " ").title()) for token in symptom_tokens]
    return {
        "id": prediction_row["id"],
        "disease": prediction_row["disease"],
        "diet": prediction_row["diet_recommendation"],
        "confidence": prediction_row["confidence"],
        "risk": prediction_row["risk_level"],
        "recovery": prediction_row["recovery_note"],
        "emailStatus": prediction_row["email_status"],
        "createdAt": prediction_row["created_at"],
        "symptoms": symptoms,
    }


def serialize_appointment(appointment_row):
    return {
        "id": appointment_row["id"],
        "doctorName": appointment_row["doctor_name"],
        "speciality": appointment_row["speciality"],
        "hospital": appointment_row["hospital"],
        "city": appointment_row["city"],
        "appointmentDate": appointment_row["appointment_date"],
        "notes": appointment_row["notes"],
        "status": appointment_row["status"],
        "createdAt": appointment_row["created_at"],
        "predictionId": appointment_row["prediction_id"],
    }


def recommendation_for_disease(disease):
    specialist = DISEASE_META.get(disease, {}).get("specialist", "General Physician")
    for doctor in DOCTOR_DIRECTORY:
        if doctor["speciality"] == specialist:
            return doctor
    return DOCTOR_DIRECTORY[0]


def create_verification(email, full_name):
    code = generate_code()
    expiry = (datetime.now() + timedelta(minutes=OTP_MINUTES)).isoformat()
    email_status = send_email(
        subject="HealthSense Email Verification OTP",
        recipient=email,
        body=(
            f"Hello {full_name},\n\n"
            f"Your verification OTP is {code}.\n"
            f"It will expire in {OTP_MINUTES} minutes.\n\n"
            "Use this code to activate your HealthSense account."
        ),
    )
    return code, expiry, email_status


def create_reset_code(email, full_name):
    code = generate_code()
    expiry = (datetime.now() + timedelta(minutes=RESET_MINUTES)).isoformat()
    email_status = send_email(
        subject="HealthSense Password Reset OTP",
        recipient=email,
        body=(
            f"Hello {full_name},\n\n"
            f"Your password reset OTP is {code}.\n"
            f"It will expire in {RESET_MINUTES} minutes.\n\n"
            "If you did not request this, you can ignore this email."
        ),
    )
    return code, expiry, email_status


def predict_disease(symptom_tokens):
    best_match = None
    best_score = -1
    symptom_set = set(symptom_tokens)

    for row in DATASET:
        score = len(symptom_set.intersection(row["symptoms"]))
        if score > best_score:
            best_score = score
            best_match = row

    disease = best_match["disease"] if best_match else "General Checkup Recommended"
    confidence_ratio = (best_score / max(len(symptom_set), 1)) if best_match else 0
    confidence = max(68, min(int(round(confidence_ratio * 100)) + 12, 98))
    disease_info = DISEASE_META.get(
        disease,
        {
            "diet": best_match["diet"] if best_match else "Balanced nutrition, hydration, and clinical follow-up",
            "risk": "Medium",
            "recovery": "Consult a medical professional for a full diagnosis",
            "specialist": "General Physician",
        },
    )
    return {
        "disease": disease,
        "diet": disease_info["diet"],
        "risk": disease_info["risk"],
        "recovery": disease_info["recovery"],
        "confidence": min(confidence, 98),
        "specialist": disease_info["specialist"],
    }


def generate_ai_reply(messages):
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None, "Gemini API key is not configured on the server."

    history = messages[-8:]
    contents = []
    for message in history:
        role = "model" if message.get("role") == "assistant" else "user"
        contents.append(
            {
                "role": role,
                "parts": [{"text": str(message.get("content", ""))}],
            }
        )

    system_prompt = (
        "You are HealthSense AI, a calm and helpful healthcare project assistant inside a "
        "disease prediction dashboard. Answer clearly and warmly. Give general wellness and "
        "project guidance, but do not claim to replace a doctor. If the user mentions severe "
        "symptoms, advise urgent professional medical care."
    )
    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
    }
    api_url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent"
    )
    req = urllib_request.Request(
        api_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )

    try:
        with urllib_request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib_error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        return None, f"Gemini request failed: {detail or exc.reason}"
    except Exception as exc:
        return None, f"Gemini request failed: {exc}"

    candidates = data.get("candidates") or []
    if not candidates:
        prompt_feedback = data.get("promptFeedback", {})
        block_reason = prompt_feedback.get("blockReason")
        if block_reason:
            return None, f"Gemini blocked the request: {block_reason}"
        return None, "Gemini did not return a response."

    parts = candidates[0].get("content", {}).get("parts", [])
    text = "\n".join(part.get("text", "") for part in parts if part.get("text")).strip()
    if not text:
        return None, "Gemini returned an empty response."
    return text, None


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "message": "Backend is running."})


@app.get("/api/symptoms")
def list_symptoms():
    return jsonify({"ok": True, "symptoms": SYMPTOM_OPTIONS})


@app.get("/api/me")
def me():
    user = get_current_user()
    return jsonify({"ok": True, "user": serialize_user(user) if user else None})


@app.post("/api/register")
def register():
    data = request.get_json(silent=True) or {}
    full_name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not full_name or not email or not password:
        return jsonify({"ok": False, "message": "Name, email, and password are required."}), 400

    db = get_db()
    existing_user = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing_user:
        return jsonify({"ok": False, "message": "This email is already registered."}), 409

    code, expiry, email_status = create_verification(email, full_name)
    default_admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    role = "admin" if email == default_admin_email else "user"

    db.execute(
        """
        INSERT INTO users (
            full_name, email, password_hash, created_at, is_verified,
            verification_code, verification_expiry, role
        )
        VALUES (?, ?, ?, ?, 0, ?, ?, ?)
        """,
        (full_name, email, generate_password_hash(password), now_iso(), code, expiry, role),
    )
    db.commit()

    return jsonify(
        {
            "ok": True,
            "requiresVerification": True,
            "email": email,
            "message": f"Registration complete. OTP email status: {email_status}. Verify your email to continue.",
        }
    )


@app.post("/api/verify-email")
def verify_email():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    otp = data.get("otp", "").strip()
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    if not user:
        return jsonify({"ok": False, "message": "User not found."}), 404
    if user["is_verified"]:
        session["user_id"] = user["id"]
        return jsonify({"ok": True, "user": serialize_user(user), "message": "Email already verified."})
    if user["verification_code"] != otp:
        return jsonify({"ok": False, "message": "Invalid OTP."}), 400

    expiry = parse_iso(user["verification_expiry"])
    if not expiry or expiry < datetime.now():
        return jsonify({"ok": False, "message": "OTP expired. Request a new one."}), 400

    db.execute(
        """
        UPDATE users
        SET is_verified = 1, verification_code = '', verification_expiry = ''
        WHERE id = ?
        """,
        (user["id"],),
    )
    db.commit()
    verified_user = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    session["user_id"] = verified_user["id"]
    return jsonify({"ok": True, "user": serialize_user(verified_user), "message": "Email verified successfully."})


@app.post("/api/resend-verification")
def resend_verification():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    if not user:
        return jsonify({"ok": False, "message": "User not found."}), 404
    if user["is_verified"]:
        return jsonify({"ok": False, "message": "This account is already verified."}), 400

    code, expiry, email_status = create_verification(user["email"], user["full_name"])
    db.execute(
        "UPDATE users SET verification_code = ?, verification_expiry = ? WHERE id = ?",
        (code, expiry, user["id"]),
    )
    db.commit()
    return jsonify({"ok": True, "message": f"New OTP sent. Email status: {email_status}."})


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    user = get_db().execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"ok": False, "message": "Invalid email or password."}), 401
    if not user["is_verified"]:
        return jsonify(
            {
                "ok": False,
                "message": "Please verify your email first.",
                "requiresVerification": True,
                "email": email,
            }
        ), 403

    session["user_id"] = user["id"]
    return jsonify({"ok": True, "message": f"Welcome back, {user['full_name']}.", "user": serialize_user(user)})


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"ok": True, "message": "Logged out successfully."})


@app.post("/api/forgot-password")
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    if not user:
        return jsonify({"ok": True, "message": "If the account exists, a reset OTP has been sent."})

    code, expiry, email_status = create_reset_code(user["email"], user["full_name"])
    db.execute(
        "UPDATE users SET reset_code = ?, reset_expiry = ? WHERE id = ?",
        (code, expiry, user["id"]),
    )
    db.commit()
    return jsonify({"ok": True, "message": f"Reset OTP prepared. Email status: {email_status}."})


@app.post("/api/reset-password")
def reset_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    otp = data.get("otp", "").strip()
    password = data.get("password", "")
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    if not user:
        return jsonify({"ok": False, "message": "User not found."}), 404
    if user["reset_code"] != otp:
        return jsonify({"ok": False, "message": "Invalid reset OTP."}), 400

    expiry = parse_iso(user["reset_expiry"])
    if not expiry or expiry < datetime.now():
        return jsonify({"ok": False, "message": "Reset OTP expired. Request a new one."}), 400

    db.execute(
        """
        UPDATE users
        SET password_hash = ?, reset_code = '', reset_expiry = ''
        WHERE id = ?
        """,
        (generate_password_hash(password), user["id"]),
    )
    db.commit()
    return jsonify({"ok": True, "message": "Password reset successful. You can log in now."})


@app.get("/api/history")
def history():
    user, error = require_login()
    if error:
        return error

    rows = get_db().execute(
        """
        SELECT id, symptoms, disease, diet_recommendation, confidence, risk_level,
               recovery_note, email_status, created_at
        FROM predictions
        WHERE user_id = ?
        ORDER BY created_at DESC
        """,
        (user["id"],),
    ).fetchall()
    return jsonify({"ok": True, "history": [serialize_prediction(row) for row in rows]})


@app.post("/api/predict")
def predict():
    user, error = require_login()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    symptom_labels = data.get("symptoms", [])
    if not isinstance(symptom_labels, list) or not symptom_labels:
        return jsonify({"ok": False, "message": "Select at least one symptom."}), 400

    symptom_tokens = []
    for label in symptom_labels:
        token = LABEL_TO_TOKEN.get(str(label).strip().lower())
        if token:
            symptom_tokens.append(token)

    if not symptom_tokens:
        return jsonify({"ok": False, "message": "No valid symptoms were provided."}), 400

    result = predict_disease(symptom_tokens)
    email_status = send_email(
        subject="Your HealthSense Prediction Result",
        recipient=user["email"],
        body=(
            f"Hello {user['full_name']},\n\n"
            f"Selected symptoms: {', '.join(symptom_labels)}\n"
            f"Predicted disease: {result['disease']}\n"
            f"Diet recommendation: {result['diet']}\n"
            f"Confidence: {result['confidence']}%\n"
            f"Risk level: {result['risk']}\n"
            f"Recommended specialist: {result['specialist']}\n\n"
            "This is an ML-based estimate and should not replace a doctor's diagnosis."
        ),
    )

    db = get_db()
    cursor = db.execute(
        """
        INSERT INTO predictions (
            user_id, symptoms, disease, diet_recommendation, confidence,
            risk_level, recovery_note, email_status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user["id"],
            ",".join(symptom_tokens),
            result["disease"],
            result["diet"],
            result["confidence"],
            result["risk"],
            result["recovery"],
            email_status,
            now_iso(),
        ),
    )
    db.commit()
    prediction_row = db.execute(
        """
        SELECT id, symptoms, disease, diet_recommendation, confidence, risk_level,
               recovery_note, email_status, created_at
        FROM predictions
        WHERE id = ?
        """,
        (cursor.lastrowid,),
    ).fetchone()

    return jsonify(
        {
            "ok": True,
            "message": f"Prediction complete. Email status: {email_status}.",
            "prediction": serialize_prediction(prediction_row),
            "recommendation": recommendation_for_disease(result["disease"]),
        }
    )


@app.get("/api/recommendations")
def recommendations():
    user, error = require_login()
    if error:
        return error

    latest_prediction = get_db().execute(
        """
        SELECT disease
        FROM predictions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (user["id"],),
    ).fetchone()
    disease = latest_prediction["disease"] if latest_prediction else "Flu"
    return jsonify({"ok": True, "doctor": recommendation_for_disease(disease)})


@app.post("/api/ai-chat")
def ai_chat():
    user, error = require_login()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    messages = data.get("messages", [])
    if not isinstance(messages, list) or not messages:
        return jsonify({"ok": False, "message": "At least one chat message is required."}), 400

    reply, ai_error = generate_ai_reply(messages)
    if ai_error:
        return jsonify({"ok": False, "message": ai_error}), 400

    return jsonify(
        {
            "ok": True,
            "reply": reply,
            "model": GEMINI_MODEL,
            "message": f"HealthSense AI replied using {GEMINI_MODEL}.",
            "user": {"id": user["id"], "email": user["email"]},
        }
    )


@app.get("/api/appointments")
def appointments():
    user, error = require_login()
    if error:
        return error

    rows = get_db().execute(
        """
        SELECT id, prediction_id, doctor_name, speciality, hospital, city,
               appointment_date, notes, status, created_at
        FROM appointments
        WHERE user_id = ?
        ORDER BY appointment_date ASC
        """,
        (user["id"],),
    ).fetchall()
    return jsonify({"ok": True, "appointments": [serialize_appointment(row) for row in rows]})


@app.post("/api/appointments")
def create_appointment():
    user, error = require_login()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    doctor_name = data.get("doctorName", "").strip()
    speciality = data.get("speciality", "").strip()
    hospital = data.get("hospital", "").strip()
    city = data.get("city", "").strip()
    appointment_date = data.get("appointmentDate", "").strip()
    notes = data.get("notes", "").strip()
    prediction_id = data.get("predictionId")

    if not all([doctor_name, speciality, hospital, city, appointment_date]):
        return jsonify({"ok": False, "message": "All appointment details are required."}), 400

    db = get_db()
    cursor = db.execute(
        """
        INSERT INTO appointments (
            user_id, prediction_id, doctor_name, speciality, hospital, city,
            appointment_date, notes, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?)
        """,
        (user["id"], prediction_id, doctor_name, speciality, hospital, city, appointment_date, notes, now_iso()),
    )
    db.commit()
    row = db.execute(
        """
        SELECT id, prediction_id, doctor_name, speciality, hospital, city,
               appointment_date, notes, status, created_at
        FROM appointments
        WHERE id = ?
        """,
        (cursor.lastrowid,),
    ).fetchone()
    return jsonify({"ok": True, "message": "Appointment booked successfully.", "appointment": serialize_appointment(row)})


@app.get("/api/admin/overview")
def admin_overview():
    _user, error = require_admin()
    if error:
        return error

    db = get_db()
    total_users = db.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
    verified_users = db.execute("SELECT COUNT(*) AS count FROM users WHERE is_verified = 1").fetchone()["count"]
    total_predictions = db.execute("SELECT COUNT(*) AS count FROM predictions").fetchone()["count"]
    total_appointments = db.execute("SELECT COUNT(*) AS count FROM appointments").fetchone()["count"]

    recent_users = db.execute(
        """
        SELECT id, full_name, email, created_at, is_verified, role
        FROM users
        ORDER BY created_at DESC
        LIMIT 8
        """
    ).fetchall()
    risk_rows = db.execute(
        """
        SELECT risk_level, COUNT(*) AS count
        FROM predictions
        GROUP BY risk_level
        """
    ).fetchall()
    return jsonify(
        {
            "ok": True,
            "stats": {
                "totalUsers": total_users,
                "verifiedUsers": verified_users,
                "totalPredictions": total_predictions,
                "totalAppointments": total_appointments,
            },
            "users": [
                {
                    "id": row["id"],
                    "name": row["full_name"],
                    "email": row["email"],
                    "joinedAt": row["created_at"],
                    "isVerified": bool(row["is_verified"]),
                    "role": row["role"],
                }
                for row in recent_users
            ],
            "riskChart": [{"label": row["risk_level"] or "Unknown", "value": row["count"]} for row in risk_rows],
        }
    )


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api/"):
        return jsonify({"ok": False, "message": "API route not found."}), 404

    requested_file = DIST_DIR / path
    if path and requested_file.exists() and requested_file.is_file():
        return send_from_directory(DIST_DIR, path)

    index_path = DIST_DIR / "index.html"
    if index_path.exists():
        return send_from_directory(DIST_DIR, "index.html")

    return jsonify({"ok": True, "message": "Frontend build not found yet. Run `npm run build` or use `npm run dev`."})


if __name__ == "__main__":
    app.run(debug=True)
