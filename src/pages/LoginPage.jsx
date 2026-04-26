import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";

function LoginPage() {
  const { currentUser, isReady, login } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isReady && currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await login(form);
    setMessage(result.message);
    if (result.ok) {
      navigate(location.state?.from || "/dashboard");
    } else if (result.requiresVerification) {
      navigate("/verify-email", { state: { email: result.email || form.email } });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-card">
      <p className="card-tag">Sign In</p>
      <h2>Log in to your workspace</h2>
      <p className="auth-copy">
        Access your disease prediction dashboard, history, appointments, and admin tools.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Enter Dashboard"}
        </button>
      </form>

      {message ? <p className="status-line">{message}</p> : null}
      <div className="auth-link-row">
        <p className="form-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
        <p className="form-switch">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
