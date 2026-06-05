export interface HealthProviderGuide {
  id: string;
  name: string;
  icon: string;
  /** Types de données généralement disponibles via ce fournisseur */
  dataTypes: string[];
  /** Étapes Android (Health Connect) */
  steps: string[];
  /** Limites ou remarques importantes */
  note?: string;
}

/**
 * Procédures pour relier les principales apps santé au tableau de bord Android.
 * L'app mobile lit Health Connect — une seule connexion suffit une fois vos apps sources configurées.
 */
export const HEALTH_PROVIDER_GUIDES: HealthProviderGuide[] = [
  {
    id: "samsung-health",
    name: "Samsung Health",
    icon: "💚",
    dataTypes: ["Pas", "Poids", "Fréquence cardiaque", "Sommeil", "Exercice"],
    steps: [
      "Installez ou mettez à jour Samsung Health et Health Connect (Play Store).",
      "Samsung Health → Paramètres → Health Connect → Autorisations → Samsung Health.",
      "Activez : pas, poids, fréquence cardiaque (et sommeil si disponible).",
      "Optionnel : Paramètres → Synchroniser avec le compte Samsung → Synchroniser maintenant.",
      "Galaxy Watch : vérifiez que la montre synchronise bien avec Samsung Health.",
    ],
    note: "Standard sur téléphones et montres Samsung.",
  },
  {
    id: "google-fit",
    name: "Google Fit / Health Connect",
    icon: "🔵",
    dataTypes: ["Pas", "Activité", "Fréquence cardiaque", "Poids"],
    steps: [
      "Google Fit migre vers Health Connect — installez Health Connect (Play Store).",
      "Ouvrez Google Fit → Profil → Paramètres → Synchronisation avec Health Connect (si proposé).",
      "Ou Health Connect → Autorisations des applications → Google Fit → activez les types souhaités.",
      "Relancez Google Fit pour forcer une synchronisation.",
    ],
    note: "Google Fit (REST) est en fin de vie ; Health Connect est le standard Android.",
  },
  {
    id: "fitbit",
    name: "Fitbit",
    icon: "⌚",
    dataTypes: ["Pas", "Fréquence cardiaque", "Sommeil", "Poids (balance Fitbit)"],
    steps: [
      "Installez l'app Fitbit et Health Connect.",
      "Fitbit → Onglet aujourd'hui → Photo de profil → Paramètres → Partage de données.",
      "Activez « Health Connect » et choisissez pas, FC, sommeil, poids.",
      "Health Connect → Autorisations → Fitbit : vérifiez que les lectures sont autorisées.",
    ],
    note: "Compte Google / Fitbit requis.",
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    icon: "🟢",
    dataTypes: ["Pas", "Fréquence cardiaque", "Sommeil", "Activités"],
    steps: [
      "Installez Garmin Connect et Health Connect.",
      "Garmin Connect → Paramètres → Appareil connecté → Health Connect (si disponible sur votre version).",
      "Sinon : Paramètres → Confidentialité → Partage tiers → activez Health Connect.",
      "Synchronisez votre montre Garmin, puis ouvrez Health Connect pour vérifier les données.",
    ],
    note: "La disponibilité Health Connect varie selon la version de Garmin Connect.",
  },
  {
    id: "oura",
    name: "Oura Ring",
    icon: "💍",
    dataTypes: ["Pas", "Sommeil", "Fréquence cardiaque", "Température (selon app)"],
    steps: [
      "Installez Oura et Health Connect.",
      "Oura → Menu ☰ → Paramètres → Health Connect → Connecter.",
      "Choisissez activité, sommeil et fréquence cardiaque.",
    ],
  },
  {
    id: "withings",
    name: "Withings (Health Mate)",
    icon: "⚖️",
    dataTypes: ["Poids", "Tension", "Fréquence cardiaque", "Pas", "Sommeil"],
    steps: [
      "Installez Health Mate et Health Connect.",
      "Health Mate → Profil → Paramètres → Health Connect → activer le partage.",
      "Autorisez poids, tension, pas et fréquence cardiaque.",
    ],
    note: "Excellent pour poids et tension artérielle.",
  },
  {
    id: "whoop",
    name: "Whoop",
    icon: "🟡",
    dataTypes: ["Fréquence cardiaque", "Sommeil", "Strain / activité"],
    steps: [
      "Installez Whoop et Health Connect.",
      "Whoop → Menu → Intégrations → Health Connect (si proposé).",
      "Activez sommeil, récupération et fréquence cardiaque.",
    ],
    note: "Le partage Health Connect Android dépend de votre version de l'app Whoop.",
  },
  {
    id: "xiaomi",
    name: "Mi Fitness / Xiaomi",
    icon: "🟠",
    dataTypes: ["Pas", "Sommeil", "Fréquence cardiaque", "Poids"],
    steps: [
      "Installez Mi Fitness (ou Zepp Life selon appareil) et Health Connect.",
      "Mi Fitness → Profil → Paramètres → Health Connect → activer la synchronisation.",
      "Accordez les autorisations pour pas, sommeil et FC.",
    ],
  },
  {
    id: "polar",
    name: "Polar Flow",
    icon: "🔴",
    dataTypes: ["Pas", "Fréquence cardiaque", "Sommeil", "Entraînements"],
    steps: [
      "Polar Flow → Paramètres → Health Connect (selon version).",
      "Synchronisez votre montre Polar avant de vérifier Health Connect.",
    ],
  },
  {
    id: "suunto",
    name: "Suunto",
    icon: "🔷",
    dataTypes: ["Pas", "Fréquence cardiaque", "Activités", "Sommeil"],
    steps: [
      "Suunto app → Paramètres → Connexions / Health Connect.",
      "Liez Health Connect et autorisez activité et FC.",
    ],
  },
  {
    id: "strava",
    name: "Strava",
    icon: "🟧",
    dataTypes: ["Activités / entraînements", "Distance (pas indirects)"],
    steps: [
      "Strava → Paramètres → Applications, services et appareils → Health Connect.",
      "Utile surtout pour marquer les jours d'entraînement ; pas optimisé pour le poids.",
    ],
    note: "Complément pour l'activité ; ne remplace pas une balance connectée pour le poids.",
  },
  {
    id: "huawei",
    name: "Huawei Health",
    icon: "🔴",
    dataTypes: ["Pas", "Sommeil", "Fréquence cardiaque"],
    steps: [
      "Huawei Health → Moi → Paramètres → Health Connect (si disponible sur votre région/appareil).",
      "Sinon export manuel ou balance connectée alternative.",
    ],
    note: "Disponibilité variable selon région et modèle.",
  },
];
