/** URL directe de l’APK Android (GitHub Releases ou override via VITE_ANDROID_APK_URL). */
export const ANDROID_APK_URL =
  import.meta.env.VITE_ANDROID_APK_URL?.trim() ||
  "https://github.com/maleselo/weight_loss_tracker/releases/latest/download/tableau-de-bord-sante.apk";

export const ANDROID_APK_FILENAME = "tableau-de-bord-sante.apk";
