export type HealthPlatform = "android" | "ios" | "both";

export type HealthBridge = "health_connect" | "apple_health";

export interface HealthProviderGuide {
  id: string;
  name: string;
  icon: string;
  platforms: HealthPlatform[];
  bridge: HealthBridge;
  /** Types de données généralement disponibles via ce fournisseur */
  dataTypes: string[];
  /** Étapes Android (Health Connect) */
  androidSteps: string[];
  /** Étapes iOS (Apple Health / HealthKit) */
  iosSteps: string[];
  /** Limites ou remarques importantes */
  note?: string;
}

/**
 * Procédures pour relier les principales apps santé au tableau de bord.
 * L'app mobile lit Health Connect (Android) ou Apple Health (iOS) — une seule connexion suffit
 * une fois vos apps sources configurées.
 */
export const HEALTH_PROVIDER_GUIDES: HealthProviderGuide[] = [
  {
    id: "samsung-health",
    name: "Samsung Health",
    icon: "💚",
    platforms: ["android"],
    bridge: "health_connect",
    dataTypes: ["Pas", "Poids", "Fréquence cardiaque", "Sommeil", "Exercice"],
    androidSteps: [
      "Installez ou mettez à jour Samsung Health et Health Connect (Play Store).",
      "Samsung Health → Paramètres → Health Connect → Autorisations → Samsung Health.",
      "Activez : pas, poids, fréquence cardiaque (et sommeil si disponible).",
      "Optionnel : Paramètres → Synchroniser avec le compte Samsung → Synchroniser maintenant.",
      "Galaxy Watch : vérifiez que la montre synchronise bien avec Samsung Health.",
    ],
    iosSteps: ["Non disponible sur iPhone. Utilisez Apple Health ou une autre app iOS."],
    note: "Standard sur téléphones et montres Samsung.",
  },
  {
    id: "apple-health",
    name: "Apple Health (Santé)",
    icon: "🍎",
    platforms: ["ios"],
    bridge: "apple_health",
    dataTypes: ["Pas", "Poids", "Fréquence cardiaque", "Sommeil", "Tension (appareils compatibles)"],
    androidSteps: ["Réservé à iPhone. Installez l'app iOS du tableau de bord."],
    iosSteps: [
      "Installez l'application tableau de bord sur iPhone (build Capacitor iOS).",
      "Ouvrez Connexions → Connecter mes données santé.",
      "Autorisez l'accès à Pas, Poids et Fréquence cardiaque dans la popup Apple.",
      "Vérifiez Réglages iPhone → Santé → Apps → que vos sources (Montre, Balance…) partagent bien les données.",
    ],
    note: "Hub central sur iPhone ; agrège Apple Watch, balance connectée, etc.",
  },
  {
    id: "google-fit",
    name: "Google Fit / Health Connect",
    icon: "🔵",
    platforms: ["android"],
    bridge: "health_connect",
    dataTypes: ["Pas", "Activité", "Fréquence cardiaque", "Poids"],
    androidSteps: [
      "Google Fit migre vers Health Connect — installez Health Connect (Play Store).",
      "Ouvrez Google Fit → Profil → Paramètres → Synchronisation avec Health Connect (si proposé).",
      "Ou Health Connect → Autorisations des applications → Google Fit → activez les types souhaités.",
      "Relancez Google Fit pour forcer une synchronisation.",
    ],
    iosSteps: ["Google Fit iOS peut alimenter Apple Health ; configurez le partage dans Google Fit iOS."],
    note: "Google Fit (REST) est en fin de vie ; Health Connect est le standard Android.",
  },
  {
    id: "fitbit",
    name: "Fitbit",
    icon: "⌚",
    platforms: ["both"],
    bridge: "health_connect",
    dataTypes: ["Pas", "Fréquence cardiaque", "Sommeil", "Poids (balance Fitbit)"],
    androidSteps: [
      "Installez l'app Fitbit et Health Connect.",
      "Fitbit → Onglet aujourd'hui → Photo de profil → Paramètres → Partage de données.",
      "Activez « Health Connect » et choisissez pas, FC, sommeil, poids.",
      "Health Connect → Autorisations → Fitbit : vérifiez que les lectures sont autorisées.",
    ],
    iosSteps: [
      "Fitbit → Profil → Paramètres → Partage de données → Apple Health.",
      "Activez les catégories souhaitées (Activité, Sommeil, Fréquence cardiaque…).",
      "Puis connectez le tableau de bord via Connexions sur l'app iOS.",
    ],
    note: "Compte Google / Fitbit requis.",
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    icon: "🟢",
    platforms: ["both"],
    bridge: "health_connect",
    dataTypes: ["Pas", "Fréquence cardiaque", "Sommeil", "Activités"],
    androidSteps: [
      "Installez Garmin Connect et Health Connect.",
      "Garmin Connect → Paramètres → Appareil connecté → Health Connect (si disponible sur votre version).",
      "Sinon : Paramètres → Confidentialité → Partage tiers → activez Health Connect.",
      "Synchronisez votre montre Garmin, puis ouvrez Health Connect pour vérifier les données.",
    ],
    iosSteps: [
      "Garmin Connect → Paramètres → Partage → Apple Health.",
      "Activez les types de données à exporter.",
      "Connectez ensuite le tableau de bord depuis l'app iOS.",
    ],
    note: "La disponibilité Health Connect varie selon la version de Garmin Connect.",
  },
  {
    id: "oura",
    name: "Oura Ring",
    icon: "💍",
    platforms: ["both"],
    bridge: "health_connect",
    dataTypes: ["Pas", "Sommeil", "Fréquence cardiaque", "Température (selon app)"],
    androidSteps: [
      "Installez Oura et Health Connect.",
      "Oura → Menu ☰ → Paramètres → Health Connect → Connecter.",
      "Choisissez activité, sommeil et fréquence cardiaque.",
    ],
    iosSteps: [
      "Oura → Paramètres → Apple Health → Connecter.",
      "Activez Sommeil, Activité et Fréquence cardiaque.",
    ],
  },
  {
    id: "withings",
    name: "Withings (Health Mate)",
    icon: "⚖️",
    platforms: ["both"],
    bridge: "health_connect",
    dataTypes: ["Poids", "Tension", "Fréquence cardiaque", "Pas", "Sommeil"],
    androidSteps: [
      "Installez Health Mate et Health Connect.",
      "Health Mate → Profil → Paramètres → Health Connect → activer le partage.",
      "Autorisez poids, tension, pas et fréquence cardiaque.",
    ],
    iosSteps: [
      "Health Mate → Profil → Paramètres → Apple Health.",
      "Activez les mesures de votre balance / BPM Connect.",
    ],
    note: "Excellent pour poids et tension artérielle.",
  },
  {
    id: "whoop",
    name: "Whoop",
    icon: "🟡",
    platforms: ["both"],
    bridge: "health_connect",
    dataTypes: ["Fréquence cardiaque", "Sommeil", "Strain / activité"],
    androidSteps: [
      "Installez Whoop et Health Connect.",
      "Whoop → Menu → Intégrations → Health Connect (si proposé).",
      "Activez sommeil, récupération et fréquence cardiaque.",
    ],
    iosSteps: [
      "Whoop → Menu → Intégrations → Apple Health.",
      "Activez les métriques souhaitées.",
    ],
    note: "Le partage Health Connect Android dépend de votre version de l'app Whoop.",
  },
  {
    id: "xiaomi",
    name: "Mi Fitness / Xiaomi",
    icon: "🟠",
    platforms: ["android"],
    bridge: "health_connect",
    dataTypes: ["Pas", "Sommeil", "Fréquence cardiaque", "Poids"],
    androidSteps: [
      "Installez Mi Fitness (ou Zepp Life selon appareil) et Health Connect.",
      "Mi Fitness → Profil → Paramètres → Health Connect → activer la synchronisation.",
      "Accordez les autorisations pour pas, sommeil et FC.",
    ],
    iosSteps: ["Mi Fitness iOS → Paramètres → Apple Health si disponible."],
  },
  {
    id: "polar",
    name: "Polar Flow",
    icon: "🔴",
    platforms: ["both"],
    bridge: "health_connect",
    dataTypes: ["Pas", "Fréquence cardiaque", "Sommeil", "Entraînements"],
    androidSteps: [
      "Polar Flow → Paramètres → Health Connect (selon version).",
      "Synchronisez votre montre Polar avant de vérifier Health Connect.",
    ],
    iosSteps: ["Polar Flow → Paramètres → Apple Health → activer le partage."],
  },
  {
    id: "suunto",
    name: "Suunto",
    icon: "🔷",
    platforms: ["both"],
    bridge: "health_connect",
    dataTypes: ["Pas", "Fréquence cardiaque", "Activités", "Sommeil"],
    androidSteps: [
      "Suunto app → Paramètres → Connexions / Health Connect.",
      "Liez Health Connect et autorisez activité et FC.",
    ],
    iosSteps: ["Suunto app → Paramètres → Apple Health."],
  },
  {
    id: "strava",
    name: "Strava",
    icon: "🟧",
    platforms: ["both"],
    bridge: "health_connect",
    dataTypes: ["Activités / entraînements", "Distance (pas indirects)"],
    androidSteps: [
      "Strava → Paramètres → Applications, services et appareils → Health Connect.",
      "Utile surtout pour marquer les jours d'entraînement ; pas optimisé pour le poids.",
    ],
    iosSteps: ["Strava → Paramètres → Lien avec Apple Health."],
    note: "Complément pour l'activité ; ne remplace pas une balance connectée pour le poids.",
  },
  {
    id: "huawei",
    name: "Huawei Health",
    icon: "🔴",
    platforms: ["android"],
    bridge: "health_connect",
    dataTypes: ["Pas", "Sommeil", "Fréquence cardiaque"],
    androidSteps: [
      "Huawei Health → Moi → Paramètres → Health Connect (si disponible sur votre région/appareil).",
      "Sinon export manuel ou balance connectée alternative.",
    ],
    iosSteps: ["Support iOS limité ; préférez Apple Health sur iPhone."],
    note: "Disponibilité variable selon région et modèle.",
  },
];

export type ProviderFilter = "all" | "android" | "ios";

export function filterProviders(filter: ProviderFilter): HealthProviderGuide[] {
  if (filter === "all") return HEALTH_PROVIDER_GUIDES;
  if (filter === "android") {
    return HEALTH_PROVIDER_GUIDES.filter((p) => p.platforms.includes("android") || p.platforms.includes("both"));
  }
  return HEALTH_PROVIDER_GUIDES.filter((p) => p.platforms.includes("ios") || p.platforms.includes("both"));
}

export function bridgeLabel(bridge: HealthBridge): string {
  return bridge === "health_connect" ? "Health Connect (Android)" : "Apple Health (iOS)";
}
