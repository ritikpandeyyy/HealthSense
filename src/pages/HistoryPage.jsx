import PageHeader from "../components/PageHeader";
import { useAppContext } from "../store/AppContext";

function HistoryPage() {
  const { userHistory } = useAppContext();

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Audit Trail"
        title="Prediction history"
        subtitle="Review previous disease predictions, symptom combinations, diet recommendations, and email delivery state."
      />

      <section className="history-grid">
        {userHistory.length ? (
          userHistory.map((entry) => (
            <article className="history-tile" key={entry.id}>
              <div className="history-tile-top">
                <div>
                  <p className="mini-tag">Prediction</p>
                  <h3>{entry.disease}</h3>
                </div>
                <span className="history-confidence">{entry.confidence}%</span>
              </div>

              <div className="history-meta">
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
                <span>{entry.risk} risk</span>
              </div>

              <div className="history-block">
                <strong>Symptoms</strong>
                <p>{entry.symptoms.join(", ")}</p>
              </div>

              <div className="history-block">
                <strong>Diet Recommendation</strong>
                <p>{entry.diet}</p>
              </div>

              <div className="history-footer">
                <span>{entry.emailStatus}</span>
                <span>{entry.recovery}</span>
              </div>
            </article>
          ))
        ) : (
          <article className="feature-panel">
            <h3>No history available</h3>
            <p>Create a disease prediction first to see saved records here.</p>
          </article>
        )}
      </section>
    </div>
  );
}

export default HistoryPage;
