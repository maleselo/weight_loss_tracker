import { HealthProviderGuideList, NativePlatformHint } from "../components/HealthProviderGuide";
import { MobileAppRequiredBanner } from "../components/MobileAppRequiredBanner";
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
    syncContext,
  } = useHealthIntegration(token);

  useAutoHealthSync(token, status?.connected);

  if (loading) return <p className="empty">Chargement…</p>;

  const canSync = isNative;

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

        <MobileAppRequiredBanner />

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className={`integration-status ${status?.connected ? "integration-status--on" : ""}`}>
          <div className="integration-status__row">
            <span className="integration-status__dot" aria-hidden />
            <div>
              <strong>Hub santé — {isNative ? nativePlatformLabel() : "application native requise"}</strong>
              <p className="sub">
                {status?.connected
                  ? `Connecté${status.last_sync_at ? ` — dernière sync ${formatWhen(status.last_sync_at)}` : ""}`
                  : canSync
                    ? "Non connecté — configurez votre app santé ci-dessous, puis connectez-vous"
                    : "Installez l'application native pour activer la synchronisation"}
              </p>
              {status?.last_sync_message && <p className="sub">{status.last_sync_message}</p>}
            </div>
          </div>
        </div>

        <section className="integration-steps">
          <h3>Connecter le tableau de bord</h3>
          <div className="integration-actions">
            {!status?.connected ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={syncing || !canSync}
                onClick={connectAndSync}
                title={
                  !canSync
                    ? "Installez l'application native — le navigateur ne peut pas accéder à Health Connect"
                    : undefined
                }
              >
                {syncing
                  ? "Connexion…"
                  : canSync
                    ? "Connecter mes données santé"
                    : "Indisponible dans le navigateur"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={syncing || !canSync}
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
            Sommeil, stress et notes : saisie manuelle dans l&apos;onglet Aujourd&apos;hui.
            {syncContext === "native-ios" && " Sur iPhone, autorisez Apple Health lors de la connexion."}
          </p>
        </section>
      </div>

      <div className="card">
        <HealthProviderGuideList
          defaultFilter={
            syncContext === "native-ios" || (syncContext === "mobile-browser" && /iPhone/i.test(navigator.userAgent))
              ? "ios"
              : syncContext === "native-android" ||
                  (syncContext === "mobile-browser" && /Android/i.test(navigator.userAgent))
                ? "android"
                : "all"
          }
        />
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
