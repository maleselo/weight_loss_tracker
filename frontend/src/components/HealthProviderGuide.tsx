import { useState } from "react";
import type { HealthProviderGuide } from "../lib/healthProviders";
import { HEALTH_PROVIDER_GUIDES } from "../lib/healthProviders";

export function HealthProviderGuideList() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="provider-guide">
      <div className="provider-guide__header">
        <h3>Configurer votre app santé</h3>
        <p className="sub">
          Choisissez votre application ci-dessous. Une fois configurée vers Health Connect, une
          seule connexion dans cette page importe toutes les données autorisées.
        </p>
      </div>

      <ul className="provider-list">
        {HEALTH_PROVIDER_GUIDES.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            open={openId === provider.id}
            onToggle={() => setOpenId(openId === provider.id ? null : provider.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function ProviderCard({
  provider,
  open,
  onToggle,
}: {
  provider: HealthProviderGuide;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="provider-card">
      <button type="button" className="provider-card__toggle" onClick={onToggle} aria-expanded={open}>
        <span className="provider-card__icon" aria-hidden>
          {provider.icon}
        </span>
        <span className="provider-card__title">
          {provider.name}
          <span className="provider-card__badges">
            <span className="provider-badge">Android</span>
          </span>
        </span>
        <span className="provider-card__chevron" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div className="provider-card__body">
          <p className="provider-card__data">
            <strong>Données :</strong> {provider.dataTypes.join(", ")}
          </p>
          {provider.note && <p className="provider-card__note">{provider.note}</p>}

          <div className="provider-procedure">
            <h4>Android — via Health Connect</h4>
            <ol>
              {provider.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </li>
  );
}

export function NativePlatformHint() {
  return (
    <div className="integration-bridge-diagram">
      <p>
        <strong>Comment ça marche</strong>
      </p>
      <ul>
        <li>
          <strong>Android :</strong> Samsung Health, Fitbit, Garmin… → <em>Health Connect</em> →
          notre app → tableau de bord
        </li>
      </ul>
    </div>
  );
}
