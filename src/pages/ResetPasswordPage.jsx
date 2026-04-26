import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";

function ResetPasswordPage() {
  const { resetPassword } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: location.state?.email || "",
    otp: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await resetPassword(form);
    setMessage(result.message);
    if (result.ok) {
      navigate("/login");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-card">
      <p className="card-tag">Reset Password</p>
      <h2>Create a new password</h2>
      <p className="auth-copy">
        Enter the reset OTP you received and choose a new password.
      </p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          OTP
          <input name="otp" type="text" maxLength="6" value={form.otp} onChange={handleChange} required />
        </label>
        <label>
          New Password
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Reset Password"}
        </button>
      </form>
      {message ? <p className="status-line">{message}</p> : null}
      <p className="form-switch">
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}

export default ResetPasswordPage;
