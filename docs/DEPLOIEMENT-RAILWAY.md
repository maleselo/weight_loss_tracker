# Déploiement Railway — guide pas à pas

Repo : `https://github.com/maleselo/weight_loss_tracker`

## Architecture

| Service Railway | Dossier racine | Rôle |
|-----------------|----------------|------|
| **Postgres** | (plugin) | Base de données |
| **api** | `backend` | FastAPI |
| **web** | `frontend` | React (fichiers statiques) |

---

## 1. Créer le projet

1. [railway.app](https://railway.app) → **Login with GitHub**
2. **New Project** → **Deploy from GitHub repo** → `weight_loss_tracker`
3. Supprime le service auto-créé si tu veux repartir proprement (⋯ → Delete), ou renomme-le en **api** plus tard.

---

## 2. PostgreSQL

1. Dans le projet : **+ New** → **Database** → **PostgreSQL**
2. Service renommé en **postgres** (optionnel)

---

## 3. Service **api** (backend)

### 3.1 Créer le service

**+ New** → **GitHub Repo** → même dépôt (ou duplique le service existant).

### 3.2 Settings

| Paramètre | Valeur |
|-----------|--------|
| **Service name** | `api` |
| **Root Directory** | `backend` |
| **Railway config file** | `/backend/railway.toml` (chemin absolu depuis la racine du repo) |
| **Builder** | Railpack (auto) — **pas** Dockerfile |
| **Custom Build Command** | **vide** |
| **Custom Start Command** | **vide** (défini dans `railway.toml` + `railpack.json`) |

Railpack installe les deps dans `/app/.venv/lib/.../site-packages`. Le script `scripts/railway-start.sh` ajoute ce dossier au `PYTHONPATH` (le binaire `/app/.venv/bin/python` est souvent un lien cassé vers mise), puis lance `alembic` et `uvicorn` via le Python mise.

### 3.3 Variables (onglet **Variables**)

Copier depuis `backend/.env.railway` (fichier local) :

| Variable | Source |
|----------|--------|
| `APP_NAME` | `Health Dashboard API` |
| `ENVIRONMENT` | `production` |
| `JWT_SECRET` | valeur dans `.env.railway` (**pas** celle du `.env` local) |
| `JWT_EXPIRE_MINUTES` | `10080` |
| `DATABASE_URL` | **Variable Reference** → service Postgres → `DATABASE_URL` |
| `FRONTEND_URL` | URL publique du frontend (ex. `https://web-production-e3f6a.up.railway.app`) — lien dans l’email de reset |

> `DATABASE_URL` Railway (`postgresql://…`) est converti automatiquement en `postgresql+psycopg://` par l’app.

`CORS_ORIGINS` : mettre l’URL du frontend **après** l’étape 4 (puis **Redeploy** api).

### 3.3.1 Email « mot de passe oublié » (SMTP)

Sans variables SMTP, l’API répond toujours « email envoyé » (sécurité) mais **aucun email ne part** — un avertissement apparaît dans les logs Railway.

Ajouter sur le service **api** (exemple [Resend](https://resend.com) avec domaine vérifié) :

| Variable | Exemple |
|----------|---------|
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `resend` |
| `SMTP_PASSWORD` | clé API `re_…` |
| `SMTP_FROM` | adresse expéditeur vérifiée chez le fournisseur (ex. `onboarding@resend.dev` en test Resend) |
| `SMTP_USE_TLS` | `true` |

Puis **Redeploy** api. Tester via la page « Mot de passe oublié » ; en cas d’échec SMTP, consulter les logs du service **api**.

### 3.4 Domaine public

**Settings** → **Networking** → **Generate Domain**

Tester : `https://<api>.up.railway.app/health` → `{"status":"ok"}`

Noter l’URL : **`https://<api>.up.railway.app`** (sans slash final).

---

## 4. Service **web** (frontend)

### 4.1 Créer le service

**+ New** → **GitHub Repo** → même dépôt.

### 4.2 Settings

| Paramètre | Valeur |
|-----------|--------|
| **Service name** | `web` |
| **Root Directory** | `frontend` |

### 4.3 Variables (obligatoire au build)

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://<api>.up.railway.app` (URL de l’étape 3.4) |

Sans cette variable, le build ne pointe pas vers la bonne API.

### 4.4 Domaine public

**Networking** → **Generate Domain**

Noter : **`https://<web>.up.railway.app`**

### 4.5 Finaliser CORS sur **api**

1. Service **api** → **Variables** → `CORS_ORIGINS` = `https://web-production-e3f6a.up.railway.app`
2. Mettre à jour `backend/.env.railway` en local (pour mémoire)
3. **Redeploy** le service **api**

---

## 5. Vérifications

1. Ouvrir l’URL **web**
2. Créer un compte → se connecter
3. Saisir une mesure, ouvrir le tableau de bord
4. Export PDF

**En cas d’erreur CORS** (console navigateur) : `CORS_ORIGINS` doit être exactement l’URL du front (https, sans slash final).

**En cas d’API injoignable** : vérifier `VITE_API_URL` sur **web** puis **Redeploy** (rebuild nécessaire).

**Mot de passe oublié sans email** : vérifier `SMTP_HOST`, `SMTP_FROM`, `SMTP_PASSWORD` et `FRONTEND_URL` sur **api** (voir § 3.3.1).

---

## 6. Ordre des opérations (résumé)

```
Postgres → api (sans CORS prod) → domaine api
       → web (VITE_API_URL = domaine api) → domaine web
       → CORS_ORIGINS sur api → redeploy api
```

---

## Coût

Environ **10–20 €/mois** (usage perso). **Project** → **Usage** pour suivre la consommation.
