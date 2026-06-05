import { ANDROID_APK_URL } from "../lib/appRelease";
import { getHealthSyncContext, isNativeHealthAvailable } from "../lib/healthConnect";

interface Props {
  variant?: "banner" | "inline";
}

/** Bouton / bandeau pour télécharger l’APK Android depuis GitHub Releases. */
export function AndroidAppInstall({ variant = "banner" }: Props) {
  if (isNativeHealthAvailable()) return null;

  const ctx = getHealthSyncContext();
  const onMobile = ctx === "mobile-browser";

  if (variant === "inline") {
    return (
      <a href={ANDROID_APK_URL} className="btn btn-primary android-install-btn" download>
        Télécharger l&apos;application Android
      </a>
    );
  }

  return (
    <div className="android-install-card">
      <strong>Application Android requise</strong>
      <p>
        {onMobile
          ? "Installez l’APK pour synchroniser Samsung Health et les autres apps via Health Connect."
          : "La sync santé fonctionne uniquement dans l’application Android installée sur votre téléphone."}
      </p>
      <a href={ANDROID_APK_URL} className="btn btn-primary android-install-btn" download>
        Installer l&apos;application Android
      </a>
      {onMobile && (
        <p className="sub android-install-note">
          Après installation, ouvrez l&apos;icône <strong>Tableau de bord santé</strong> (pas le
          navigateur) → Connexions → Connecter mes données santé.
        </p>
      )}
    </div>
  );
}
