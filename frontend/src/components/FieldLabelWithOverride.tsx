import type { FieldOverrideState } from "../lib/measureFields";
import { FieldOverrideStatus } from "./FieldOverrideStatus";

interface Props {
  label: string;
  showOverride: boolean;
  state: FieldOverrideState;
  onResumeSync?: () => void;
  disabled?: boolean;
}

export function FieldLabelWithOverride({ label, showOverride, state, onResumeSync, disabled }: Props) {
  if (!showOverride) {
    return <span className="field-label-row">{label}</span>;
  }

  return (
    <span className="field-label-row field-label-row--stacked">
      <span>{label}</span>
      <FieldOverrideStatus state={state} onResumeSync={onResumeSync} disabled={disabled} />
    </span>
  );
}
