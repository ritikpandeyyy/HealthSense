import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="hero-badge">HealthSense AI Platform</div>
        <h1>Smarter health guidance with calm, connected care.</h1>
        <p>
          HealthSense brings prediction insights, diet guidance, appointment
          planning, and AI-powered support into one soothing digital health
          experience designed to feel clear, modern, and trustworthy.
        </p>

        <div className="hero-grid">
          <article>
            <span>01</span>
            <h3>Guided health dashboard</h3>
            <p>See risk signals, recent predictions, trends, and follow-up actions in one place.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Prediction with context</h3>
            <p>Turn symptom selection into meaningful disease estimates, recovery notes, and diet support.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Continuous support</h3>
            <p>Stay connected with OTP-secured access, appointment booking, and an AI assistant for everyday questions.</p>
          </article>
        </div>
      </section>

      <section className="auth-panel">
        <Outlet />
      </section>
    </div>
  );
}

export default AuthLayout;
