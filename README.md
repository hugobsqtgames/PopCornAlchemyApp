# Pop-Corn Alchemy

Jeu de fusion d'emojis sur la pop culture, pour iPhone et iPad.

- `mobile/` — l'app iOS (Expo / React Native). Voir [le guide d'installation](docs/GUIDE_INSTALLATION_IPHONE.md).
- `design/` — les maquettes de chaque écran.
- `docs/` — cahier des charges et guides.
- `web-original/` — la version web d'origine, gardée pour référence.

## Développement

```bash
cd mobile
npm install
npx expo start      # lancer l'app (QR code pour Expo Go)
npm test            # tests de la logique du jeu
npm run typecheck   # vérification TypeScript
npx expo lint       # lint
```

Les 200 niveaux sont générés par `mobile/scripts/build-levels.js` à partir de la version web
(`node scripts/build-levels.js` depuis `mobile/`).
