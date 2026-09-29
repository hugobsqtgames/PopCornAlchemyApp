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
- **Un raté coûte une vie et on retente le même niveau** (depuis le 28/09/2026). La réponse
  s'affiche seulement au game over, quand on passe le niveau, ou après 3 essais en mode Zen.
- **Indices** : révéler un emoji (1 💡), retirer 5 intrus (15 💰), mélanger la grille (gratuit).
- **Animations** : fusion, confettis, option « Réduire les animations ».
- **Rappel du défi du jour à 18 h** (notification locale, proposée après le 1ᵉʳ défi du jour).
- **Demande de note** : fenêtre officielle d'Apple après la 3ᵉ victoire.
- **Codes cadeaux** (`mobile/src/game/codes.ts`) : `POPCORN500` (500 💰), `BIENVENUE` (300 💰 + 5 💡),
  `TIKTOK` (3 💡 + 1 ⏭️). En ajouter un demande une mise à jour de l'app.
- **Étoiles par niveau** (1 à 3) : ⭐ trouvé, ⭐ sans indice ni erreur, ⭐ rapide (au moins la moitié
  de la barre de temps). Règles dans `mobile/src/game/progress.ts` (`starsFor`).
- **Pop-Cornédex** (Profil → Pop-Cornédex) : album des réponses trouvées par catégorie, les autres
  en « ??? ». Toucher une réponse la rejoue (mode `replay` : sans vies, sans pièces, sans toucher à
  la partie sauvegardée) pour viser les 3 étoiles.
- **Cadeau du jour** : une fenêtre sur l'accueil à la première ouverture de chaque jour. 7 jours
  (25 💰, 1 💡, 50 💰, 1 🛡️, 75 💰, 2 💡, puis 200 💰 + 1 🧊), puis ça recommence. Un jour raté
  ne remet pas à zéro.
- **Protection de série 🧊** : utilisée toute seule si on rate un jour de défi. 2 au maximum,
  250 💰 dans la boutique (Bonus) ou offerte le 7ᵉ jour du calendrier.
- **Voix d'annonceur** (en anglais, toutes langues) : « Great combo! » (combo 3), « Fever time! »
  (combo 5), « Unstoppable! » (combo 10), « Perfect! », « Amazing! ». Se coupe dans les réglages.
  Fichiers générés par `mobile/scripts/build-voice.py` avec la voix LJSpeech (domaine public,
  donc utilisable dans une app payante).
- **Statistiques** (Profil → Statistiques) : temps de jeu, précision, catégorie préférée,
  meilleur jour, étoiles, précision par catégorie.
- **Carte de l'aventure** (Nouvelle partie → Aventure Facile/Moyen/Difficile) : un chemin de
  niveaux par palier, ordre fixe par difficulté (`adventureIds` dans `mobile/src/game/rules.ts`).
  La progression est gardée niveau par niveau : un game over ne renvoie plus au niveau 1.
  Toucher un niveau passé → sa fiche (réponse, étoiles) et « Rejouer ». Le mode Catégorie
  reste libre (niveaux mélangés).
- **21 mondes sur la carte** (`mobile/src/game/worlds.ts`, dessins dans
  `mobile/src/components/world-deco.tsx`) : un monde par palier, jamais deux fois le même
  (Facile « Le tour du monde » 10, Moyen « Le voyage extraordinaire » 7, Difficile « Les légendes » 4).
  Couleur du sol, panneau d'entrée, écran « Les mondes », annonce « Nouveau monde débloqué ! »
  en fin de palier.
- **13 langues** : français, anglais, espagnol, allemand, italien, portugais (Brésil), néerlandais, polonais,
  turc, russe, japonais, coréen, chinois simplifié. Les 10 dernières sont dans `mobile/src/i18n/packs/*.json`
  (textes de l'app, réponses des 400 niveaux, noms des 21 mondes, trophées). Pluriels russes et polonais
  gérés. Un test vérifie qu'aucune langue n'oublie un texte, une réponse ou un `{nombre}`. Fiche App Store
  et 7 images dans chaque langue. Traductions faites par Claude : à faire relire par des natifs si possible.
- **Langue automatique** (`mobile/src/i18n/device.ts`) : plus d'écran de langue au premier lancement,
  l'app parle la langue du téléphone (la première connue dans l'ordre du téléphone : français, anglais
  ou espagnol ; anglais pour toutes les autres). Réglages → Langue permet de choisir à la main ou de
  revenir à « Langue du téléphone ». iOS connaît les 3 langues (`supportedLocales` et `locales` dans
  `app.json`) : elles apparaissent sur l'App Store et dans le réglage de langue par app de l'iPhone.
- **Décors peints** (`mobile/src/components/world-scene.tsx`) : chaque monde a un vrai paysage
  sur les deux bords (collines, mer, forêt, immeubles, montagnes, rideaux, planètes, récifs, lave…),
  une texture au sol, un chemin dessiné entre les niveaux et des groupes de petits dessins.
  La carte est dessinée par bandes de 400 px, seulement près de l'écran. Aperçu de chaque paysage
  dans « Les mondes » et dans l'annonce de nouveau monde. À vérifier sur un vrai iPhone : la
  fluidité du défilement.
- **Popi, la mascotte** (`mobile/src/components/mascot.tsx`, dessin vectoriel, 7 humeurs) :
  dans la carte du niveau (réagit : content, aux anges, en feu en Fever, triste après une
  erreur, surpris), carte réponse, palier, game over, victoire, pause (endormi), accueil, carte.
  Maquettes : https://claude.ai/artifact/96Jqd2TaYSKaGZpfVbd5Sb
- **Autres** : roue quotidienne, boutique (thèmes, styles, avatars, bonus), 46 trophées,
  mode sombre, iPad, gros texte jusqu'à +30 %, musique et sons.
- **Achats intégrés et pubs : code prêt mais éteint** (`MONEY_READY = false` dans
  `mobile/src/services/store-services.ts`). Tout est expliqué dans `store/VERSION_1_1.md`.
  La 1.0 se construit depuis la branche : les modules natifs de la 1.1 (pubs, achats, iCloud) sont
  mis de côté par le commit `a8fb48e` ; `git revert a8fb48e` les remet pour la 1.1.
- **Sauvegarde iCloud (1.1)** : même progression sur iPhone et iPad, automatique. Module maison
  `mobile/modules/cloud-kv` (mis de côté pour la 1.0, voir ci-dessus), règles de fusion dans
  `mobile/src/store/cloud-merge.ts`. Détails dans `store/VERSION_1_1.md`. Pas encore testée sur de
  vrais appareils.
- **Classement Game Center** : pas encore codé, caché (`GAME_CENTER_READY`).
- **Audit de robustesse fait** : sauvegarde abîmée, liens piégés, doubles taps, arrière-plan.

## Tests

- `cd mobile && npm test` → 129 tests : règles du jeu, sauvegarde, achats, fusion iCloud, langues.
- `npx tsc --noEmit` (types) et `npx expo lint` (règles de code).
- `bash tests-e2e/run.sh` → robot complet (248 vérifications) + robot casseur (75 scénarios)
  + robot « argent » (`money.mjs`, 13) + robot « bêta-testeur » (`beta.mjs`, 88 : fin de monde,
  victoire finale, game over, pause, indices, iPad, mode sombre, les 13 langues, réponses
  les plus longues sur petit iPhone, toute la carte).
- Bêta-test du 28/09/2026 : 690 vues d'écran (tailles × thèmes × langues) sans erreur ni texte
  coupé après corrections.

## Prêt pour l'App Store

- `store/FICHE_APP_STORE.md` : nom, sous-titre, description, mots-clés, nouveautés, en FR, EN
  et ES, avec les limites de caractères d'Apple respectées.
- `store/screenshots/` : 7 images par langue, iPhone 6,9 pouces et iPad 13 pouces.
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

- **29/09/2026 : version 1.0 (build 1) soumise à Apple** après test TestFlight sur l'iPhone de Hugo
  (tout fonctionne). Fiche remplie en 13 langues, âge 9+, « Données non collectées », Game Center
  désactivé sur la fiche (il arrive en 1.1). Guide pas à pas : `store/GUIDE_PUBLICATION.md`.
- Demande envoyée au support Apple pour afficher « Hugo BUSQUET » (sans « Anselme ») comme vendeur.

- **Compte Apple Developer : validé** (payé le 27/09/2026, 98,99 €) avec un nouvel identifiant
  Apple. Utiliser ce même identifiant pour TestFlight et App Store Connect.
- `mobile/eas.json` est prêt (profil `production`, numéro de build géré par EAS).
- **Expo** : compte `aazerty12`, projet `@aazerty12/popcorn-alchemy` relié (projectId dans `app.json`).
  Le jeton `EXPO_TOKEN` est dans les variables d'environnement de la session et fonctionne.
- Module audio : micro et audio en arrière-plan désactivés dans `app.json` (sinon Apple risquait de
  refuser l'app : règle 2.5.4).
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
2. **Version 1.1** : vrais achats et pubs (code prêt, voir `store/VERSION_1_1.md` pour ce que Hugo
   doit créer chez Apple et Google), puis pack de bienvenue à 0,99 €, Game Center, missions du
   jour, énigme impossible du jour.
3. **Version 1.2** : mode inversé, mode soirée à plusieurs, cadres de profil, animations
   de Popi plus poussées (clignement des yeux…).
   (Déjà faits en avance : étoiles, Pop-Cornédex, cadeau du jour, protection de série, voix
   d'annonceur, statistiques.)
4. **Version 1.3** : « Crée ton énigme », parrainage, allemand, italien et portugais.
5. **Plus tard** : carte de l'aventure, widget, mode Duel en direct, « Ton année Pop-Corn ».

## Préférences de Hugo

- Du propre, sans erreur, sans qu'il ait à repasser derrière. Tout tester avant de livrer.
- Un design épuré, pas trop flashy, et pas besoin de faire défiler l'écran pour l'essentiel.
- Il veut qu'on lui dise honnêtement ce qui n'a pas pu être vérifié.
