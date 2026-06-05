import { getHealthSyncContext, type HealthSyncContext } from "../lib/healthConnect";

export function MobileAppRequiredBanner() {
  const ctx = getHealthSyncContext();
  if (ctx === "native-android" || ctx === "native-ios") return null;

  return (
    <div className="alert integration-browser-note integration-browser-note--prominent">
      <strong>
        {ctx === "mobile-browser"
          ? "Le navigateur sur téléphone ne suffit pas"
          : "Application mobile requise"}
      </strong>

      {ctx === "mobile-browser" ? (
        <>
          <p>
            Vous utilisez Chrome, Samsung Internet ou un autre <strong>navigateur</strong> sur
            votre téléphone. C&apos;est normal que « Connecter » ne fonctionne pas : Android et
            iOS n&apos;autorisent <em>pas</em> les sites web à lire Samsung Health, Health Connect
            ou Apple Health.
          </p>
          <p>
            <strong>Ajouter à l&apos;écran d&apos;accueil</strong> (raccourci PWA) ne change rien —
            il faut installer l&apos;<strong>application native</strong> du tableau de bord (fichier
            APK sur Android).
          </p>
          <MobileInstallSteps ctx={ctx} />
        </>
      ) : (
        <>
          <p>
            Ouvrez cette page depuis l&apos;application installée sur votre téléphone, pas depuis un
            navigateur d&apos;ordinateur.
          </p>
          <MobileInstallSteps ctx={ctx} />
        </>
      )}
    </div>
  );
}

function MobileInstallSteps({ ctx }: { ctx: HealthSyncContext }) {
  const isAndroidHint =
    ctx === "mobile-browser" &&
    typeof navigator !== "undefined" &&
    /Android/i.test(navigator.userAgent);

  return (
    <div className="install-steps-box">
      <h4>Comment faire (Android)</h4>
      <ol>
        <li>
          Sur un PC : générez l&apos;APK du projet (voir README) ou demandez le fichier{" "}
          <code>app-debug.apk</code> à l&apos;administrateur.
        </li>
        <li>Transférez l&apos;APK sur votre Samsung (mail, Drive, câble USB).</li>
        <li>
          Ouvrez le fichier → autorisez « Sources inconnues » si Android le demande → Installez.
        </li>
        <li>
          Lancez l&apos;icône <strong>Tableau de bord santé</strong> (pas Chrome) → connectez-vous
          → onglet <strong>Connexions</strong> → <strong>Connecter mes données santé</strong>.
        </li>
      </ol>

      {isAndroidHint && (
        <p className="sub install-steps-note">
          Vous êtes sur Android : une fois l&apos;APK installée, n&apos;utilisez plus cette adresse
          dans le navigateur pour la sync.
        </p>
      )}

      {ctx === "mobile-browser" && /iPhone|iPad/i.test(navigator.userAgent) && (
        <>
          <h4>iPhone</h4>
          <ol>
            <li>Build iOS via Xcode sur Mac (<code>npx cap open ios</code>).</li>
            <li>Installez via TestFlight ou câble, puis ouvrez l&apos;app native (pas Safari).</li>
          </ol>
        </>
      )}

      <details className="install-steps-dev">
        <summary>Pour le développeur (générer l&apos;APK)</summary>
        <pre>{`cd frontend
npm run build
npx cap add android    # première fois
npx cap sync android
npx cap open android   # Android Studio → Run sur téléphone
# ou : Build → Build APK(s)`}</pre>
      </details>
    </div>
  );
}
