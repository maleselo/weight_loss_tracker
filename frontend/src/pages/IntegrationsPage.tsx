import { HealthProviderGuideList, NativePlatformHint } from "../components/HealthProviderGuide";
import { MobileAppRequiredBanner } from "../components/MobileAppRequiredBanner";
import { useAuth } from "../context/AuthContext";
import { useHealthIntegration } from "../hooks/useHealthIntegration";
import { nativePlatformLabel } from "../lib/healthConnect";
import { HEALTH_SYNC_PERIOD_OPTIONS } from "../lib/healthSyncPeriod";

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
    syncDays,
    setSyncDays,
    isNative,
  } = useHealthIntegration(token);

  if (loading) return <p className="empty">Chargement…</p>;

  const canSync = isNative;

  return (
    <>
      <div className="card">
        <h2>Connexions santé</h2>
        <p className="card-intro">
          Reliez <strong>n&apos;importe quelle app santé Android</strong> (Samsung Health, Fitbit,
          Garmin, Oura, Withings…) à votre tableau de bord via <strong>Health Connect</strong>.
        </p>

        <NativePlatformHint />

        <MobileAppRequiredBanner />

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className={`integration-status ${status?.connected ? "integration-status--on" : ""}`}>
          <div className="integration-status__row">
            <span className="integration-status__dot" aria-hidden />
            <div>
              <strong>Health Connect — {isNative ? nativePlatformLabel() : "application Android requise"}</strong>
              <p className="sub">
                {status?.connected
                  ? `Connecté${status.last_sync_at ? ` — dernière sync ${formatWhen(status.last_sync_at)}` : ""}`
                  : canSync
                    ? "Non connecté — configurez votre app santé ci-dessous, puis connectez-vous"
                    : "Installez l'application Android pour activer la synchronisation"}
              </p>
              {status?.last_sync_message && <p className="sub">{status.last_sync_message}</p>}
            </div>
          </div>
        </div>

        <section className="integration-steps">
          <h3>Connecter le tableau de bord</h3>
          <div className="integration-sync-period">
            <p className="sub">Période à importer depuis Health Connect</p>
            <div className="preset-row">
              {HEALTH_SYNC_PERIOD_OPTIONS.map((days) => (
                <button
                  key={days}
                  type="button"
                  className={`btn-preset ${syncDays === days ? "btn-preset--active" : ""}`}
                  disabled={syncing}
                  onClick={() => setSyncDays(days)}
                >
                  {days} jours
                </button>
              ))}
            </div>
          </div>
          <div className="integration-actions">
            {!status?.connected ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={syncing || !canSync}
                onClick={connectAndSync}
                title={
                  !canSync
                    ? "Installez l'application Android — le navigateur ne peut pas accéder à Health Connect"
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
            Import automatique : pas, poids, masse grasse (%), FC, tension, sommeil (😞😐😊),
            stress et énergie (calculés uniquement si HRV, FC ou sommeil suffisants).
            Choisissez une période courte si vos données récentes sont incomplètes.
            Les champs modifiés dans Aujourd&apos;hui (✎) ne sont pas écrasés à la sync.
            Faim et notes : saisie manuelle dans l&apos;onglet Aujourd&apos;hui.
          </p>
        </section>
      </div>

      <div className="card">
        <HealthProviderGuideList />
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
