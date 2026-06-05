import { APP_VERSION } from "../lib/appVersion";

export function AppVersion() {
  return <span className="app-version">v{APP_VERSION}</span>;
}
