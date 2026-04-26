import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { useAppContext } from "../store/AppContext";

function PredictPage() {
  const { symptomCatalog, createPrediction } = useAppContext();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [result, setResult] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((item) => item !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedSymptoms.length) {
      setMessage("Please select at least one symptom.");
      return;
    }
    setIsSubmitting(true);
    const response = await createPrediction(selectedSymptoms);
    setMessage(response.message);
    if (response.ok) {
      setResult(response.prediction);
      setRecommendation(response.recommendation);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Prediction Lab"
        title="Disease prediction and diet recommendation"
        subtitle="Select symptoms to generate an estimate, email summary, and specialist recommendation."
      />

      <section className="predict-layout">
        <form className="feature-panel" onSubmit={handleSubmit}>
          <div className="panel-head">
            <div>
              <p className="mini-tag">Symptom Selector</p>
              <h3>Choose patient symptoms</h3>
            </div>
            <span className="confidence-pill">{selectedSymptoms.length} selected</span>
          </div>

          <div className="symptom-grid-react">
            {symptomCatalog.map((symptom) => {
              const active = selectedSymptoms.includes(symptom);
              return (
                <button className={`symptom-card ${active ? "active" : ""}`} key={symptom} onClick={() => toggleSymptom(symptom)} type="button">
                  {symptom}
                </button>
              );
            })}
          </div>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Generating..." : "Generate Prediction"}
          </button>
          {message ? <p className="status-line">{message}</p> : null}
        </form>

        <aside className="feature-panel result-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Result Panel</p>
              <h3>Prediction output</h3>
            </div>
          </div>

          {result ? (
            <>
              <div className="result-hero">
                <span className="result-percent">{result.confidence}%</span>
                <div>
                  <p className="mini-tag">Predicted Condition</p>
                  <h4>{result.disease}</h4>
                </div>
              </div>

              <div className="result-stack">
                <article>
                  <span>Diet Recommendation</span>
                  <p>{result.diet}</p>
                </article>
                <article>
                  <span>Risk Level</span>
                  <p>{result.risk}</p>
                </article>
                <article>
                  <span>Email Status</span>
                  <p>{result.emailStatus}</p>
                </article>
                <article>
                  <span>Recovery Note</span>
                  <p>{result.recovery}</p>
                </article>
              </div>

              {recommendation ? (
                <div className="doctor-card inline-card">
                  <h4>{recommendation.doctorName}</h4>
                  <p>{recommendation.speciality}</p>
                  <small>{recommendation.hospital}, {recommendation.city}</small>
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-panel">
              <h4>No prediction yet</h4>
              <p>Start by selecting symptoms. Your dashboard and history will update after prediction.</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

export default PredictPage;
