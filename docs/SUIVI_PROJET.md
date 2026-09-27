# Suivi du projet Pop-Corn Alchemy

Fiche de reprise : où en est l'app, ce qui a été décidé et la suite.
**À lire en premier** avant de reprendre le travail, dans une nouvelle conversation par exemple.
Dernière mise à jour : 27/09/2026.

## Qui, quoi

- **Hugo_BSQT** (@hugo_bsqt sur TikTok, Instagram et YouTube). Débutant en code : tout expliquer
  simplement, en français. Travaille sur Mac et iPhone 17 Pro.
- **L'app** : jeu de devinettes en emojis, adapté de la version web d'origine (`web-original/`).
  Cible : iPhone et iPad, en FR, EN et ES.
- **Code** : `mobile/` (Expo SDK 57, React Native, expo-router). Branche de travail :
  `claude/web-to-ios-app-1azlp5` sur GitHub (hugobsqtgames/PopCornAlchemyApp, dépôt **public**).

## État actuel : version 1.0 terminée ✅

Testée par Hugo sur son iPhone : tout est OK. Contenu :

- **400 niveaux** dans 16 catégories.
  - Difficultés : Facile 191 · Moyen 139 · Difficile 70. Une aventure par difficulté.
  - Les niveaux sont générés par `mobile/scripts/build-levels.js` et `levels-more.js`.
- **Modes** : Classique (aventure), Catégorie, Zen, Chrono, Hardcore, Défi du jour, Défier un ami.
- **Premier niveau guidé** (Titanic 🚢🧊) au premier lancement.
- **La réponse s'affiche** quand on perd une vie ou qu'on passe un niveau.
- **Indices** : révéler un emoji (1 💡), retirer 5 intrus (15 💰), mélanger la grille (gratuit).
- **Animations** : fusion, confettis, option « Réduire les animations ».
- **Rappel du défi du jour à 18 h** (notification locale, proposée après le 1ᵉʳ défi du jour).
- **Demande de note** : fenêtre officielle d'Apple après la 3ᵉ victoire.
- **Codes cadeaux** (`mobile/src/game/codes.ts`) : `POPCORN500` (500 💰), `BIENVENUE` (300 💰 + 5 💡),
  `TIKTOK` (3 💡 + 1 ⏭️). En ajouter un demande une mise à jour de l'app.
- **Autres** : roue quotidienne, boutique (thèmes, styles, avatars, bonus), 46 trophées,
  mode sombre, iPad, gros texte jusqu'à +30 %, musique et sons.
- **Cachés tant qu'ils ne sont pas branchés** : achats intégrés, pubs, classement Game Center.
  Réglages dans `mobile/src/services/store-services.ts` (`MONEY_READY` et `GAME_CENTER_READY`).
- **Audit de robustesse fait** : sauvegarde abîmée, liens piégés, doubles taps, arrière-plan.

## Tests

- `cd mobile && npm test` → 39 tests des règles du jeu.
- `npx tsc --noEmit` (types) et `npx expo lint` (règles de code).
- `bash tests-e2e/run.sh` → robot complet (172 vérifications) + robot casseur (47 scénarios).

## Prêt pour l'App Store

- `store/FICHE_APP_STORE.md` : nom, sous-titre, description, mots-clés, nouveautés, en FR, EN
  et ES, avec les limites de caractères d'Apple respectées.
- `store/screenshots/` : 6 images par langue, iPhone 6,9 pouces et iPad 13 pouces.
- `store/VERIFICATION_APPLE.md` : les règles d'Apple vérifiées une par une.
  - Âge : **9+** (violence de dessin animé et horreur « rares ou légères »).
  - Confidentialité : « Données non collectées ».
  - Risque connu : les codes cadeaux (règle 3.1.1). Si Apple les refuse, on retire la ligne
    « Code cadeau ».
- Pages web de confidentialité et d'assistance : `docs/index.html` et `docs/confidentialite.html`.
  Elles seront en ligne via GitHub Pages (branche ci-dessus, dossier `/docs`) à ces adresses :
  - https://hugobsqtgames.github.io/PopCornAlchemyApp/
  - https://hugobsqtgames.github.io/PopCornAlchemyApp/confidentialite.html

## En cours / bloquant ⏳

- **Compte Apple Developer : inscription bloquée.**
  - Sur le site : « Your enrollment could not be completed ».
  - Dans l'app Apple Developer : « Enrollment through the Apple Developer app is not available
    for this Apple Account ».
  - Conseil donné : ne pas recréer d'identifiant Apple ; vérifier s'il y a une inscription
    « en cours » sur developer.apple.com/account ; contacter l'assistance
    (developer.apple.com/contact → Membership and Account → Program Enrollment).
- **À faire par Hugo** :
  - créer son compte gratuit sur expo.dev ;
  - ajouter le jeton `EXPO_TOKEN` dans les réglages de l'environnement (jamais dans le chat) ;
  - activer GitHub Pages ;
  - télécharger TestFlight le moment venu.
- **Sécurité, hors app** : l'ancien site web contient le mot de passe admin « popcorn7 » en clair
  dans un dépôt public. Hugo doit le changer si ce site est encore en ligne.

## La suite

1. Compte Apple débloqué + expo.dev + `EXPO_TOKEN` → construire l'app avec EAS → TestFlight →
   test final → remplir la fiche App Store → envoi à Apple.
2. **Version 1.1** : vrais achats et pubs, pack de bienvenue à 0,99 €, Game Center (classement et
   trophées), missions du jour, calendrier de connexion, protection de série, énigme impossible
   du jour, étoiles par niveau.
3. **Version 1.2** : Pop-Cornédex, mode inversé, mode soirée à plusieurs, mascotte et voix
   d'annonceur, page de statistiques, cadres de profil.
4. **Version 1.3** : « Crée ton énigme », parrainage, allemand, italien et portugais,
   sauvegarde iCloud.
5. **Plus tard** : carte de l'aventure, widget, mode Duel en direct, « Ton année Pop-Corn ».

## Préférences de Hugo

- Du propre, sans erreur, sans qu'il ait à repasser derrière. Tout tester avant de livrer.
- Un design épuré, pas trop flashy, et pas besoin de faire défiler l'écran pour l'essentiel.
- Il veut qu'on lui dise honnêtement ce qui n'a pas pu être vérifié.
