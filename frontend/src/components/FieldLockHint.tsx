interface Props {
  locked?: boolean;
}

export function FieldLockHint({ locked }: Props) {
  if (!locked) return null;
  return (
    <span
      className="field-lock"
      title="Modifié par vous — non écrasé à la synchronisation Health Connect"
      aria-label="Verrouillé contre la synchronisation"
    >
      ✎
    </span>
  );
}
