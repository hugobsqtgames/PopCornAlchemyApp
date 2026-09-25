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

Les 400 niveaux sont générés par `mobile/scripts/build-levels.js` à partir de la version web
et de `mobile/scripts/levels-more.js` (`node scripts/build-levels.js` depuis `mobile/`).
Chaque niveau a une difficulté (1 facile, 2 moyen, 3 difficile) : une aventure par difficulté.
