import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { getAuthErrorMessage } from "../context/AuthContext";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!tokenFromUrl) {
      setError("Lien invalide — demandez un nouveau lien depuis la page mot de passe oublié.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.resetPassword(tokenFromUrl, password);
      setMessage(res.message);
      setTimeout(() => navigate("/connexion"), 2000);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Nouveau mot de passe</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      <form className="card form-grid" onSubmit={onSubmit}>
        <label className="field">
          Nouveau mot de passe
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="field">
          Confirmer le mot de passe
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting || !!message}>
          {submitting ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
      <p className="auth-footer">
        <Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link>
        {" · "}
        <Link to="/connexion">Connexion</Link>
      </p>
    </div>
  );
}
