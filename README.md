## Health Dashboard (FR)

Application web pour suivre au quotidien poids, tension, bien-être, etc.

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173) — le proxy Vite redirige `/api` vers le backend.

### Backend Python

Objectif: API pour saisir des mesures santé jour par jour (poids, %MG, tension, etc.), exporter CSV/PDF, et partager en lecture seule avec expiration.

### Stack
- **API**: FastAPI
- **DB**: Postgres
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic

### Démarrage rapide (local)

1) Lancer Postgres

```bash
cd backend
docker compose up -d db
```

2) Configurer l’environnement

```bash
cp .env.example .env
```

3) Installer et lancer l’API

```bash
cd backend
python3.12 -m venv .venv   # Python >= 3.11 requis
source .venv/bin/activate
pip install -U pip
pip install -e ".[dev]"

alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4) Ouvrir la doc
- Swagger: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

### Authentification

1. Créer un compte : `POST /api/auth/register` `{ "email": "...", "password": "..." }`
2. Se connecter : `POST /api/auth/login` (formulaire OAuth2 : `username` = email, `password`)
3. Utiliser le token : en-tête `Authorization: Bearer <token>`

Les mesures et le tableau de bord nécessitent un token.

### Export PDF

- `GET /api/export/pdf?start=YYYY-MM-DD&end=YYYY-MM-DD` — rapport médecin (synthèse, graphique, tableau)

### Tableau de bord (API)

- `GET /api/dashboard/summary` — indicateurs (Δ 7j/30j, moyenne mobile 7j, tendance 14j)
- `GET /api/dashboard/series/poids_kg?start=...&end=...` — courbe + moyenne mobile

### Déploiement Railway

Guide complet : [docs/DEPLOIEMENT-RAILWAY.md](docs/DEPLOIEMENT-RAILWAY.md)

- Secrets prod locaux : `backend/.env.railway` (non versionné)
- Config auto : `backend/railway.toml`, `frontend/railway.toml`

### Lancer les deux (dev)

Terminal 1 — API :
```bash
cd backend && source .venv/bin/activate
docker compose up -d db
uvicorn app.main:app --reload --port 8000
```

Terminal 2 — interface :
```bash
cd frontend && npm run dev
```

### Application Android (sync Health Connect)

La synchronisation Samsung Health / Fitbit / Garmin ne fonctionne **pas** dans le navigateur mobile — installez l’APK native.

**Téléchargement** : [dernière release GitHub](https://github.com/maleselo/weight_loss_tracker/releases/latest/download/tableau-de-bord-sante.apk) (bouton aussi sur le tableau de bord web).

**Build local** :
```bash
cd frontend
VITE_API_URL=https://votre-api.railway.app npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# APK : android/app/build/outputs/apk/debug/app-debug.apk
```

**Release CI** : workflow `.github/workflows/android-release.yml` (tag `app-v*` ou lancement manuel). Définir la variable de dépôt `VITE_API_URL` (URL de l’API Railway).

