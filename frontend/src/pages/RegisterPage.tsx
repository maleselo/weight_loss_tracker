import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getAuthErrorMessage, useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { register, token, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [taille, setTaille] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && token) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const taille_cm = taille ? Number(taille) : undefined;
      await register(email, password, taille_cm);
      navigate("/");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Inscription</h1>
      {error && <div className="alert alert-error">{error}</div>}
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
        <label className="field">
          Mot de passe (8 caractères min.)
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
          Taille (cm, optionnel — pour l&apos;IMC plus tard)
          <input
            type="number"
            inputMode="decimal"
            min={120}
            max={230}
            placeholder="175"
            value={taille}
            onChange={(e) => setTaille(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Création…" : "Créer mon compte"}
        </button>
      </form>
      <p className="auth-footer">
        Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
      </p>
    </div>
  );
}
