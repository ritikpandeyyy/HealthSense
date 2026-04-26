import { useEffect, useRef, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useAppContext } from "../store/AppContext";

function AIAssistantPage() {
  const { askAiAssistant, aiModel } = useAppContext();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello, I’m your HealthSense AI assistant. You can ask about symptoms, diet ideas, project usage, or how to navigate this app.",
    },
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("Listening... speak now.");
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      setInput(transcript.trim());
    };

    recognition.onerror = () => {
      setIsListening(false);
      setStatus("Voice input failed. Please try again or type your question.");
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatus((currentStatus) =>
        currentStatus === "Listening... speak now."
          ? "Voice captured. You can edit the text before sending."
          : currentStatus
      );
    };

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
      recognition.stop();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsSubmitting(true);
    setStatus("HealthSense AI is thinking...");

    const response = await askAiAssistant(nextMessages);
    if (response.ok) {
      setMessages([...nextMessages, { role: "assistant", content: response.reply }]);
      setStatus(response.message);
    } else {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "I couldn’t answer just now. Please check whether the Gemini API key is configured correctly on the backend.",
        },
      ]);
      setStatus(response.message);
    }

    setIsSubmitting(false);
  };

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      setStatus("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    recognitionRef.current.start();
  };

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Conversational Care"
        title="HealthSense AI assistant"
        subtitle="Let users ask questions naturally through Gemini-powered chat while keeping the API key protected on the server."
      />

      <section className="assistant-layout">
        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Live Chat</p>
              <h3>Ask anything</h3>
            </div>
            <span className="confidence-pill">{aiModel || "Gemini not connected yet"}</span>
          </div>

          <div className="chat-thread">
            {messages.map((message, index) => (
              <article
                className={`chat-bubble ${message.role === "user" ? "chat-user" : "chat-assistant"}`}
                key={`${message.role}-${index}`}
              >
                <span className="mini-tag">{message.role === "user" ? "You" : "Assistant"}</span>
                <p>{message.content}</p>
              </article>
            ))}
          </div>

          <form className="assistant-form" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about symptoms, diet, your dashboard, or general health guidance..."
            />
            <div className="assistant-actions">
              <button
                className={`voice-button ${isListening ? "voice-button-live" : ""}`}
                type="button"
                onClick={handleVoiceToggle}
                disabled={!voiceSupported || isSubmitting}
              >
                {isListening ? "Stop Mic" : "Use Mic"}
              </button>
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>

          {status ? <p className="status-line">{status}</p> : null}
        </article>

        <aside className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Usage Notes</p>
              <h3>How this assistant works</h3>
            </div>
          </div>

          <div className="feed-list">
            <article className="feed-card">
              <h4>Secure by design</h4>
              <p>The Gemini key stays on the backend. The browser only talks to your Flask API.</p>
            </article>
            <article className="feed-card">
              <h4>Good use cases</h4>
              <p>Users can ask about symptoms, diet suggestions, app navigation, and general wellness questions.</p>
            </article>
            <article className="feed-card">
              <h4>Voice enabled</h4>
              <p>Use the mic button to speak your question, then review the transcript before sending.</p>
            </article>
            <article className="feed-card">
              <h4>Important boundary</h4>
              <p>This assistant should support, not replace, a licensed medical professional.</p>
            </article>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default AIAssistantPage;
