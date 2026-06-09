import {
  TRACKING_CATEGORIES,
  type CatalogToggle,
} from "../lib/trackingCatalog";

interface TrackingFieldTogglesProps {
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  highlightSensitive?: boolean;
  highlightNew?: ReadonlySet<string>;
}

export function TrackingFieldToggles({
  selected,
  onChange,
  highlightSensitive = false,
  highlightNew,
}: TrackingFieldTogglesProps) {
  function toggle(t: CatalogToggle) {
    const next = new Set(selected);
    if (next.has(t.id)) next.delete(t.id);
    else next.add(t.id);
    onChange(next);
  }

  return (
    <div className="tracking-toggles">
      {TRACKING_CATEGORIES.map((cat) => (
        <section key={cat.id} className="tracking-category">
          <h3>{cat.label}</h3>
          <ul className="tracking-toggle-list">
            {cat.toggles.map((t) => {
              const isNew = highlightNew?.has(t.id);
              const classes = [
                "tracking-toggle",
                t.sensitive && highlightSensitive ? "tracking-toggle--sensitive" : "",
                isNew ? "tracking-toggle--new" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={t.id}>
                  <label className={classes}>
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      onChange={() => toggle(t)}
                    />
                    <span className="tracking-toggle__text">
                      <span className="tracking-toggle__label">{t.label}</span>
                      {t.description && (
                        <span className="tracking-toggle__desc">{t.description}</span>
                      )}
                      {t.sensitive && highlightSensitive && (
                        <span className="tracking-toggle__badge">Sensible</span>
                      )}
                      {isNew && <span className="tracking-toggle__badge tracking-toggle__badge--new">Nouveau</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
