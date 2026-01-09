# OPJ Capture - Frontend

Interface React + TailwindCSS pour le système d'enregistrement des bandits.

## Design

Thème **noir/blanc professionnel** avec :
- Fond principal : noir (`#050505`)
- Cartes : blanc ou gris foncé
- Typographie : Inter (Google Fonts)
- Style minimaliste et institutionnel

## Installation

```bash
cd frontend
npm install
```

## Développement

```bash
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173` (port par défaut de Vite).

## Build pour production

```bash
npm run build
```

## Structure

- `src/pages/` - Pages principales (Login, Dashboard, etc.)
- `src/layouts/` - Layouts réutilisables (MainLayout avec sidebar)
- `src/components/` - Composants réutilisables
- `src/index.css` - Styles Tailwind globaux

## Connexion à l'API Symfony

L'API Symfony doit être accessible sur `http://localhost:8000`.

Le login se fait via `POST /api/login` avec :
```json
{
  "email": "admin@opj.com",
  "password": "Admin123!"
}
```
