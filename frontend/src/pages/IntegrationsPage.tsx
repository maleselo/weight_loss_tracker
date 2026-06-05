import { HealthProviderGuideList, NativePlatformHint } from "../components/HealthProviderGuide";
import { useAuth } from "../context/AuthContext";
import { useAutoHealthSync, useHealthIntegration } from "../hooks/useHealthIntegration";
import { nativePlatformLabel } from "../lib/healthConnect";

export function IntegrationsPage() {
  const { token } = useAuth();
  const {
    status,
    loading,
    syncing,
    error,
    message,
    connectAndSync,
    syncNow,
    disconnect,
    isNative,
    platform,
  } = useHealthIntegration(token);

  useAutoHealthSync(token, status?.connected);

  if (loading) return <p className="empty">Chargement…</p>;

  return (
    <>
      <div className="card">
        <h2>Connexions santé</h2>
        <p className="card-intro">
          Reliez <strong>n&apos;importe quelle app santé</strong> (Samsung Health, Apple Health,
          Fitbit, Garmin, Oura, Withings…) à votre tableau de bord. Sur Android tout passe par{" "}
          <strong>Health Connect</strong> ; sur iPhone par <strong>Apple Health</strong>.
        </p>

        <NativePlatformHint />

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className={`integration-status ${status?.connected ? "integration-status--on" : ""}`}>
          <div className="integration-status__row">
            <span className="integration-status__dot" aria-hidden />
            <div>
              <strong>Hub santé — {isNative ? nativePlatformLabel() : "application mobile requise"}</strong>
              <p className="sub">
                {status?.connected
                  ? `Connecté${status.last_sync_at ? ` — dernière sync ${formatWhen(status.last_sync_at)}` : ""}`
                  : "Non connecté — configurez d'abord votre app ci-dessous, puis connectez-vous ici"}
              </p>
              {status?.last_sync_message && <p className="sub">{status.last_sync_message}</p>}
            </div>
          </div>
        </div>

        {!isNative && (
          <div className="alert integration-browser-note">
            <strong>Application mobile requise</strong>
            <p>
              La synchronisation automatique ne fonctionne pas depuis un navigateur desktop.
              Installez l&apos;app sur votre téléphone Android ou iPhone, connectez-vous, puis
              revenez sur cette page.
            </p>
            <p className="sub" style={{ marginTop: "0.5rem" }}>
              Android :{" "}
              <code>cd frontend && npm run build && npx cap sync android && npx cap open android</code>
              <br />
              iPhone :{" "}
              <code>cd frontend && npm run build && npx cap sync ios && npx cap open ios</code>
            </p>
          </div>
        )}

        <section className="integration-steps">
          <h3>Connecter le tableau de bord</h3>
          <div className="integration-actions">
            {!status?.connected ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={syncing}
                onClick={connectAndSync}
              >
                {syncing ? "Connexion…" : "Connecter mes données santé"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={syncing}
                  onClick={syncNow}
                >
                  {syncing ? "Synchronisation…" : "Synchroniser maintenant"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={syncing}
                  onClick={disconnect}
                >
                  Déconnecter
                </button>
              </>
            )}
          </div>
          <p className="sub integration-hint">
            Import automatique : pas, poids, fréquence cardiaque (selon ce que vos apps partagent).
            Sommeil, stress et notes : saisie manuelle ou apps compatibles à venir.
            {platform === "ios" && " Sur iPhone, autorisez Apple Health lors de la connexion."}
          </p>
        </section>
      </div>

      <div className="card">
        <HealthProviderGuideList defaultFilter={platform === "ios" ? "ios" : platform === "android" ? "android" : "all"} />
      </div>
    </>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
