import PageHeader from "../components/PageHeader";
import { useAppContext } from "../store/AppContext";

function DashboardPage() {
  const { currentUser, userHistory, appointments, doctorRecommendation } = useAppContext();

  const latest = userHistory[0];
  const totalPredictions = userHistory.length;
  const highRiskCount = userHistory.filter((item) => item.risk === "High").length;
  const avgConfidence = totalPredictions
    ? Math.round(userHistory.reduce((sum, item) => sum + item.confidence, 0) / totalPredictions)
    : 0;

  const symptomCountMap = {};
  userHistory.forEach((entry) => {
    entry.symptoms.forEach((symptom) => {
      symptomCountMap[symptom] = (symptomCountMap[symptom] || 0) + 1;
    });
  });
  const topSymptoms = Object.entries(symptomCountMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const weeklyConfidence = userHistory.slice(0, 6).reverse();
  const riskCount = ["Low", "Moderate", "Medium", "High"].map((label) => ({
    label,
    value: userHistory.filter((item) => item.risk === label).length,
  }));

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${currentUser?.name?.split(" ")[0] || "User"}`}
        subtitle="Track your diagnostic activity, OTP-verified account status, doctor suggestions, and trend charts."
      />

      <section className="stats-grid">
        <article className="stat-card accent-red">
          <span>Total Predictions</span>
          <strong>{totalPredictions}</strong>
          <p>Saved to your health timeline.</p>
        </article>
        <article className="stat-card accent-gold">
          <span>Average Confidence</span>
          <strong>{avgConfidence}%</strong>
          <p>Across recent diagnostic sessions.</p>
        </article>
        <article className="stat-card accent-green">
          <span>High Risk Flags</span>
          <strong>{highRiskCount}</strong>
          <p>Cases that need faster follow-up.</p>
        </article>
        <article className="stat-card accent-blue">
          <span>Appointments</span>
          <strong>{appointments.length}</strong>
          <p>{currentUser?.isVerified ? "Verified account active" : "Pending verification"}</p>
        </article>
      </section>

      <section className="dashboard-columns">
        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Latest Analysis</p>
              <h3>Diagnostic snapshot</h3>
            </div>
            <span className="confidence-pill">{latest ? `${latest.confidence}% confidence` : "No data"}</span>
          </div>

          {latest ? (
            <div className="diagnostic-layout">
              <div className="diagnostic-main">
                <h4>{latest.disease}</h4>
                <p>{latest.diet}</p>
                <div className="recovery-box">
                  <span>Recovery Guidance</span>
                  <strong>{latest.recovery}</strong>
                </div>
              </div>

              <div className="timeline-box">
                <p className="mini-tag">Selected Symptoms</p>
                <ul className="clean-list">
                  {latest.symptoms.map((symptom) => (
                    <li key={symptom}>{symptom}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="muted-copy">Run a prediction to populate your dashboard.</p>
          )}
        </article>

        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Pattern Watch</p>
              <h3>Most frequent symptoms</h3>
            </div>
          </div>

          <div className="trend-list">
            {topSymptoms.length ? (
              topSymptoms.map(([symptom, count]) => (
                <div className="trend-row" key={symptom}>
                  <div className="trend-row-top">
                    <span>{symptom}</span>
                    <strong>{count} cases</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: `${Math.min(100, count * 22)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="muted-copy">No symptom trends yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-columns chart-columns">
        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Confidence Chart</p>
              <h3>Recent prediction scores</h3>
            </div>
          </div>
          <div className="bar-chart">
            {weeklyConfidence.length ? (
              weeklyConfidence.map((entry) => (
                <div className="bar-chart-item" key={entry.id}>
                  <div className="bar-chart-track">
                    <div className="bar-chart-fill" style={{ height: `${entry.confidence}%` }} />
                  </div>
                  <span>{entry.confidence}%</span>
                </div>
              ))
            ) : (
              <p className="muted-copy">No chart data yet.</p>
            )}
          </div>
        </article>

        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Risk Chart</p>
              <h3>Prediction risk distribution</h3>
            </div>
          </div>
          <div className="risk-chart-list">
            {riskCount.map((item) => (
              <div className="trend-row" key={item.label}>
                <div className="trend-row-top">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="progress-track">
                  <div className="progress-bar soft-bar" style={{ width: `${Math.min(100, item.value * 30)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-columns">
        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Doctor Recommendation</p>
              <h3>Next consultation suggestion</h3>
            </div>
          </div>
          {doctorRecommendation ? (
            <div className="doctor-card">
              <h4>{doctorRecommendation.doctorName}</h4>
              <p>{doctorRecommendation.speciality}</p>
              <p>{doctorRecommendation.hospital}</p>
              <small>{doctorRecommendation.city}</small>
            </div>
          ) : (
            <p className="muted-copy">Run a prediction to unlock doctor suggestions.</p>
          )}
        </article>

        <article className="feature-panel dark-panel">
          <p className="mini-tag">Account Status</p>
          <h3>Security and care flow</h3>
          <p>
            OTP verification, password reset, appointment booking, and admin reporting are now part of the project flow.
          </p>
          <div className="status-chip-row">
            <span className="status-chip">{currentUser?.isVerified ? "Email Verified" : "Email Pending"}</span>
            <span className="status-chip">Password Reset Ready</span>
            <span className="status-chip">Appointments Enabled</span>
          </div>
        </article>
      </section>
    </div>
  );
}

export default DashboardPage;
