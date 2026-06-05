import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { getAuthErrorMessage } from "../context/AuthContext";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDebugUrl(null);
    setSubmitting(true);
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      setMessage(res.message);
      if (res.debug_reset_url) setDebugUrl(res.debug_reset_url);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Mot de passe oublié</h1>
      <p className="auth-intro">
        Saisissez votre email. Si un compte existe, vous recevrez un lien pour choisir un nouveau mot
        de passe.
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      {debugUrl && (
        <div className="alert integration-browser-note">
          <strong>Mode dev (SMTP non configuré)</strong>
          <p>
            <a href={debugUrl}>Ouvrir le lien de réinitialisation</a>
          </p>
        </div>
      )}
      <form className="card form-grid" onSubmit={onSubmit}>
        <label className="field">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Envoi…" : "Envoyer le lien"}
        </button>
      </form>
      <p className="auth-footer">
        <Link to="/connexion">Retour à la connexion</Link>
      </p>
    </div>
  );
}
