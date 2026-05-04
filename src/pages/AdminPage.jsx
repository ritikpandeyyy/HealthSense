import { useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { useAppContext } from "../store/AppContext";

function StatCard({ label, value, sub, accent }) {
  return (
    <article className={`stat-card ${accent}`}>
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
      <p>{sub}</p>
    </article>
  );
}

function ProgressList({ items, maxValue, barClass }) {
  if (!items?.length) return <p className="muted-copy">No data yet.</p>;
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="risk-chart-list">
      {items.map((item) => (
        <div className="trend-row" key={item.label}>
          <div className="trend-row-top">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="progress-track">
            <div
              className={`progress-bar ${barClass || ""}`}
              style={{ width: `${Math.round((item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminPage() {
  const { adminOverview, refreshAdminOverview } = useAppContext();

  useEffect(() => {
    refreshAdminOverview();
  }, []);

  const s = adminOverview?.stats;

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Administration"
        title="Admin panel"
        subtitle="Full-system metrics — users, predictions, disease distribution, symptoms, emails, and appointments."
      />

      <section className="admin-section-label">
        <p className="mini-tag">User Metrics</p>
      </section>
      <section className="stats-grid">
        <StatCard label="Total Users" value={s?.totalUsers} sub="All registered accounts." accent="accent-red" />
        <StatCard label="Verified Users" value={s?.verifiedUsers} sub="Email-confirmed accounts." accent="accent-green" />
        <StatCard label="Active Users" value={s?.activeUsers} sub="Users with at least one prediction." accent="accent-blue" />
        <StatCard label="Unverified" value={s?.unverifiedUsers} sub="Pending email confirmation." accent="accent-gold" />
      </section>

      <section className="admin-section-label">
        <p className="mini-tag">Prediction Metrics</p>
      </section>
      <section className="stats-grid">
        <StatCard label="Total Predictions" value={s?.totalPredictions} sub="All saved diagnostic records." accent="accent-blue" />
        <StatCard label="Today" value={s?.predictionsToday} sub="Predictions in the last 24 hours." accent="accent-green" />
        <StatCard label="This Week" value={s?.predictionsThisWeek} sub="Predictions in the last 7 days." accent="accent-gold" />
        <StatCard label="Avg Confidence" value={s?.avgConfidence ? `${s.avgConfidence}%` : "—"} sub="Mean model confidence score." accent="accent-red" />
      </section>

      <section className="admin-section-label">
        <p className="mini-tag">System Metrics</p>
      </section>
      <section className="stats-grid">
        <StatCard label="Appointments" value={s?.totalAppointments} sub="Total care follow-ups booked." accent="accent-blue" />
        <StatCard label="Emails Delivered" value={s?.emailDelivered} sub="Successfully sent via SendGrid." accent="accent-green" />
        <StatCard label="Emails Failed" value={s?.emailFailed} sub="Delivery errors — check logs." accent="accent-red" />
        <StatCard label="Emails Simulated" value={s?.emailSimulated} sub="Logged locally, not sent." accent="accent-gold" />
      </section>

      <section className="dashboard-columns">
        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Disease Breakdown</p>
              <h3>Top predicted conditions</h3>
            </div>
          </div>
          <ProgressList items={adminOverview?.diseaseChart} />
        </article>

        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Risk Distribution</p>
              <h3>Population risk levels</h3>
            </div>
          </div>
          <ProgressList items={adminOverview?.riskChart} barClass="soft-bar" />

          {adminOverview?.appointmentStatus?.length ? (
            <>
              <div className="admin-divider" />
              <div className="panel-head">
                <div>
                  <p className="mini-tag">Appointments</p>
                  <h3>Status breakdown</h3>
                </div>
              </div>
              <ProgressList items={adminOverview.appointmentStatus} barClass="soft-bar" />
            </>
          ) : null}
        </article>
      </section>

      <section className="dashboard-columns">
        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Symptom Intelligence</p>
              <h3>Top 10 reported symptoms</h3>
            </div>
          </div>
          <ProgressList items={adminOverview?.topSymptoms} />
        </article>

        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Recent Activity</p>
              <h3>Latest predictions</h3>
            </div>
          </div>
          <div className="admin-pred-list">
            {adminOverview?.recentPredictions?.length ? (
              adminOverview.recentPredictions.map((p) => (
                <div className="admin-pred-row" key={p.id}>
                  <div className="admin-pred-main">
                    <strong>{p.disease}</strong>
                    <span className="admin-pred-user">{p.userName}</span>
                  </div>
                  <div className="admin-pred-meta">
                    <span className={`admin-risk-chip risk-${(p.risk || "").toLowerCase()}`}>{p.risk || "—"}</span>
                    <span className="admin-conf">{p.confidence}%</span>
                    <span className={`admin-email-chip email-${(p.emailStatus || "").toLowerCase()}`}>{p.emailStatus || "—"}</span>
                  </div>
                  <small className="muted-copy">{new Date(p.createdAt).toLocaleString()}</small>
                </div>
              ))
            ) : (
              <p className="muted-copy">No predictions recorded yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="feature-panel">
        <div className="panel-head">
          <div>
            <p className="mini-tag">Recent Users</p>
            <h3>Account activity</h3>
          </div>
        </div>
        <div className="admin-user-grid">
          {adminOverview?.users?.map((user) => (
            <article className="feed-card" key={user.id}>
              <div className="feed-top">
                <h4>{user.name}</h4>
                <span className={`admin-role-chip role-${user.role}`}>{user.role}</span>
              </div>
              <p>{user.email}</p>
              <small>
                {user.isVerified ? "Verified" : "Pending verification"} &bull;{" "}
                {new Date(user.joinedAt).toLocaleString()}
              </small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminPage;
