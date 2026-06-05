import { AndroidAppInstall } from "./AndroidAppInstall";
import { getHealthSyncContext } from "../lib/healthConnect";

export function MobileAppRequiredBanner() {
  const ctx = getHealthSyncContext();
  if (ctx === "native-android") return null;

  return (
    <div className="alert integration-browser-note integration-browser-note--prominent">
      <strong>
        {ctx === "mobile-browser"
          ? "Le navigateur sur téléphone ne suffit pas"
          : "Application Android requise"}
      </strong>

      {ctx === "mobile-browser" ? (
        <p>
          Chrome ou Samsung Internet ne peuvent pas lire Health Connect. Installez l&apos;application
          Android ci-dessous — un raccourci « Ajouter à l&apos;écran d&apos;accueil » ne suffit pas.
        </p>
      ) : (
        <p>
          Ouvrez l&apos;application Android installée sur votre téléphone, pas le navigateur de
          l&apos;ordinateur.
        </p>
      )}

      <AndroidAppInstall variant="inline" />
    </div>
  );
}
