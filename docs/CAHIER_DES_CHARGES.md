# Pop-Corn Alchemy — Cahier des charges iOS

Document de référence pour le développement de l'app iPhone.
Maquettes : dossier `design/` (à ouvrir dans le canvas de design partagé).

## 1. Décisions prises

| Sujet | Choix |
|---|---|
| Technologie | Expo (React Native) + EAS Build (compilation et envoi à Apple dans le cloud) |
| Matériel | Mac + iPhone (test en direct via Expo Go puis TestFlight) |
| Style | « Pop épuré » : fond papier, une couleur d'action, pixel réservé au logo (v2) |
| Appareils | Tous les iPhone (SE → Pro Max) + iPad, mode sombre automatique |
| Argent | Pubs (AdMob, vidéos récompensées) + achats intégrés (pièces, pack sans pub) |
| Classement | Game Center (classements + succès) |
| Logo | Nouvelle icône : fiole d'alchimie remplie de pop-corn |
| Niveaux | Nettoyés et complétés : 10 paliers × 20 niveaux = 200 niveaux |
| Langues | Français, anglais, espagnol (100 % des textes traduits) |
| Gardé | Roue de la chance, liens TikTok/Instagram/YouTube, défier un ami, arbre de trophées |
| Supprimé | Compteur de vues + mot de passe, faux classement, serveur Express, dépendance Gemini |

## 2. Charte graphique (v2 « Pop épuré »)

- Fond Papier `#FBF6EC`, cartes blanches, texte Encre `#1F1B2D`, légendes `#6E6882`, bordures `#ECE3D2`.
- **Une seule couleur d'action** : Rouge pop-corn `#D93A3A` (texte blanc, contraste AA).
- Beurre `#FFC93C` réservé aux gains (pièces, combo, récompenses). Vert `#1FA463` = réussite.
- Teintes pastel très claires pour les fonds d'icônes, jamais en aplat plein écran.
- Polices : Rubik (tout le texte et les scores) ; Press Start 2P uniquement pour le logo et les grands
  moments (BRAVO!, GAME OVER, PAUSE, VICTOIRE).
- Boutons « touche » : ombre pleine sous le bouton, qui s'enfonce à l'appui (+ vibration légère).
- Mode sombre automatique (suit le réglage de l'iPhone), gratuit.
- 6 thèmes à débloquer : Pop-corn, Menthe, Lavande, Minuit, Cinéma, Rétro 8-bit (le look flashy
  du site d'origine, proposé en option pour les nostalgiques).

## 2 bis. Écrans et tailles

- Règle n°1 : chaque écran important tient sur un **iPhone SE (375 × 667) sans défiler**.
  Seuls les Réglages défilent (la partie aide/légal est sous le pli).
- Les grands iPhone reçoivent plus d'espace (tuiles plus grandes, logo affiché), jamais plus de contenu.
- Un seul bouton principal par écran, en bas, à portée de pouce.
- iPad : mise en page en 2 colonnes (accueil : logo + bouton / raccourcis ; jeu : objectif + actions /
  grille 5 × 4), barre d'onglets flottante en haut comme dans iPadOS.

## 3. Écrans

Navigation principale par barre d'onglets : **Jouer · Boutique · Trophées · Profil**.

1. Choix de la langue (premier lancement)
2. Tutoriel (premier lancement, revisible depuis Réglages / Pause)
3. Accueil : profil, pièces, indices, série, JOUER, reprendre, défi du jour, modes, roue, défier, classement
4. Catégories (11 cartes avec progression)
5. Modes : Classique, Chrono, Hardcore
6. Jeu : HUD (pause, niveau/palier, vies), score/combo/record, chrono bonus, objectif, cases de fusion,
   bonus (bouclier, passer, double, indice), grille 4×5, bouton FUSIONNER
7. Jeu : bonne réponse + mode FEVER
8. Pause (feuille du bas) : reprendre, sons, vibrations, règles, défier, quitter
9. Palier terminé
10. Game over (continuer avec une pub ou 150 pièces)
11. Victoire finale
12. Défi du jour (calendrier de série, coffre 7 jours)
13. Boutique : Pièces, Bonus, Thèmes, Styles, Avatars
14. Roue de la chance (8 cases, aucune case vide, tour bonus avec pub)
15. Trophées (arbre)
16. Profil & stats (+ boutons Game Center)
17. Défier un ami (partage iOS natif, défis reçus via lien)
18. Réglages

## 4. Économie rééquilibrée (proposition)

| Gain | Pièces |
|---|---|
| Niveau réussi | 5 à 15 (+ bonus de combo) |
| Palier terminé | +50 et +3 indices |
| Défi du jour terminé | +50 et +2 indices |
| Pub récompensée | +25 (5 par jour max) |
| Roue | 25 / 50 / 100 / 500, indices, bouclier, cadeau |
| Victoire finale | +500 |

| Dépense | Prix |
|---|---|
| 5 indices | 100 |
| Bouclier | 150 |
| Passer un niveau | 200 |
| Double pièces | 250 |
| Avatar | 200 |
| Thèmes | 400 · 600 · 800 · 1 200 · 2 000 |
| Styles (bonus de score) | 0 puis +150 par cran, dernier 2 250 |
| Continuer après game over | 150 ou une pub |

Achats intégrés (prix proposés) : 500 pièces 0,99 € · 1 200 pièces 1,99 € · 3 500 pièces 4,99 € ·
8 000 pièces 9,99 € · Pack sans pub (+1 000 pièces) 3,99 €.

## 5. Bugs du site à ne pas reproduire

- Textes restés en français dans les autres langues (chrono écoulé, roue, cadeaux).
- Date du défi du jour en heure UTC au lieu de l'heure locale.
- Palier 8 à 10 niveaux au lieu de 20, YouTubeurs en double.
- Nom demandé deux fois pour le classement en fin de partie.
- `skipLevel` sur le dernier niveau plante la partie.
- Indice qui remet un fond blanc sur les thèmes sombres.

## 6. Ce qu'il faudra créer côté Apple / Google (pendant le dev)

- Compte Apple Developer (99 €/an).
- Fiche App Store Connect, achats intégrés, classement et succès Game Center.
- Compte Google AdMob + formulaire de consentement (RGPD / App Tracking Transparency).
- Politique de confidentialité hébergée en ligne (obligatoire pour l'App Store).
