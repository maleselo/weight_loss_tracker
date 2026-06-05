import { useState } from "react";
import type { HealthProviderGuide, ProviderFilter } from "../lib/healthProviders";
import { bridgeLabel, filterProviders } from "../lib/healthProviders";

interface Props {
  defaultFilter?: ProviderFilter;
}

export function HealthProviderGuideList({ defaultFilter = "all" }: Props) {
  const [filter, setFilter] = useState<ProviderFilter>(defaultFilter);
  const [openId, setOpenId] = useState<string | null>(null);
  const providers = filterProviders(filter);

  return (
    <section className="provider-guide">
      <div className="provider-guide__header">
        <h3>Configurer votre app santé</h3>
        <p className="sub">
          Choisissez votre application ci-dessous. Une fois configurée, une seule connexion dans
          cette page importe toutes les données autorisées.
        </p>
        <div className="preset-row provider-filter-row">
          {(
            [
              ["all", "Tous"],
              ["android", "Android"],
              ["ios", "iPhone"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`btn-preset ${filter === key ? "btn-preset--active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="provider-list">
        {providers.map((provider) => (
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
  const showAndroid =
    provider.platforms.includes("android") || provider.platforms.includes("both");
  const showIos = provider.platforms.includes("ios") || provider.platforms.includes("both");

  return (
    <li className="provider-card">
      <button type="button" className="provider-card__toggle" onClick={onToggle} aria-expanded={open}>
        <span className="provider-card__icon" aria-hidden>
          {provider.icon}
        </span>
        <span className="provider-card__title">
          {provider.name}
          <span className="provider-card__badges">
            {provider.platforms.includes("android") && (
              <span className="provider-badge">Android</span>
            )}
            {provider.platforms.includes("ios") && <span className="provider-badge">iOS</span>}
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

          {showAndroid && (
            <ProcedureBlock
              title={`Android — via ${bridgeLabel("health_connect")}`}
              steps={provider.androidSteps}
            />
          )}
          {showIos && (
            <ProcedureBlock
              title={`iPhone — via ${bridgeLabel("apple_health")}`}
              steps={provider.iosSteps}
            />
          )}
        </div>
      )}
    </li>
  );
}

function ProcedureBlock({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="provider-procedure">
      <h4>{title}</h4>
      <ol>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
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
          <strong>Android :</strong> Samsung Health, Fitbit, Garmin… →{" "}
          <em>Health Connect</em> → notre app → tableau de bord
        </li>
        <li>
          <strong>iPhone :</strong> Apple Watch, Fitbit, Oura… → <em>Apple Health</em> → notre app
          → tableau de bord
        </li>
      </ul>
    </div>
  );
}
