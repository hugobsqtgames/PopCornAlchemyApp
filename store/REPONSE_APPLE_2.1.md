# Réponse à Apple — Guideline 2.1 (Information Needed)

Apple n'a pas refusé le jeu : c'est une demande d'informations, habituelle pour un nouveau compte
développeur. Il faut :

1. **Filmer l'écran de l'iPhone** en jouant (voir plus bas).
2. **Répondre** dans App Store Connect avec le texte anglais ci-dessous + la vidéo.
3. **Copier le même texte** dans « Informations utiles à la vérification » → **Remarques**
   (Apple le demande pour les prochaines fois), puis **Enregistrer**.

---

## 1. La vidéo (2 à 3 minutes)

**Activer l'enregistrement d'écran** (une seule fois) : Réglages de l'iPhone → Centre de contrôle →
ajoute « Enregistrement de l'écran ».

**Avant de filmer** : iOS à jour (Réglages → Général → Mise à jour logicielle), mode Ne pas déranger,
et supprime puis réinstalle l'app depuis TestFlight pour repartir de zéro (Apple veut voir le
lancement de l'app depuis le début).

**Filmer** : Centre de contrôle (glisser depuis le coin en haut à droite) → bouton rond
d'enregistrement → attendre 3 secondes → ensuite, dans cet ordre :

1. Depuis l'écran d'accueil, **ouvrir l'app** (Apple veut voir le lancement).
2. Faire le **premier niveau guidé** (tutoriel).
3. Jouer **2 ou 3 niveaux de l'aventure**, dont une erreur (une vie en moins, même niveau).
4. Utiliser **un indice** (💡).
5. Montrer la **carte de l'aventure**.
6. Ouvrir le **défi du jour** et jouer 1 niveau.
7. Depuis l'accueil, ouvrir **Modes** (Zen, Chrono, Hardcore, Catégorie) et lancer 1 niveau en Zen.
8. Montrer la **roue**, la **boutique** (achats en pièces du jeu uniquement), le **Pop-Cornédex**,
   les **trophées**.
9. Ouvrir les **Réglages** (roue dentée en haut de l'accueil) : langue, sons, et **Code cadeau** (taper POPCORN500).
10. Revenir à l'accueil et arrêter l'enregistrement (barre rouge en haut → Arrêter).

La vidéo est dans l'app Photos.

**L'envoyer** : dans la réponse App Store Connect, bouton pour joindre un fichier. Si la vidéo est trop
lourde, mets-la sur YouTube en **« Non répertoriée »** (ou iCloud Drive / Google Drive avec lien
public) et colle le lien à la place de `[VIDEO LINK OR "attached"]`.

---

## 2. Le texte à envoyer (en anglais)

```
Hello, thank you for the review. Here is the requested information.

1. SCREEN RECORDING
A screen recording made on a physical iPhone running the latest iOS is attached: [VIDEO LINK OR "attached"]
It starts with the app launch and shows the typical flow: the guided first level, adventure levels (including a wrong answer: the player loses a life and tries the same level again), a clue, the adventure map, the daily challenge, the other modes, the lucky wheel, the in-game shop, the Pop-Cornédex album, the trophies, the settings and a gift code.
The app has no account registration or login (so no account deletion is needed), no user-generated content, and no paid content or in-app purchases.

2. PURPOSE AND TARGET AUDIENCE
Pop-Corn Alchemy is a casual emoji guessing game for everyone aged 9 and up (families, students, adults). Each level shows the name of a movie, TV show, country, brand, dish, etc. and a grid of 20 emojis; the player picks the emojis that represent it and fuses them. It is a light, offline pastime that exercises memory and general knowledge, with 400 levels in 16 categories and 3 difficulty levels.

3. HOW TO ACCESS THE MAIN FEATURES
No login, no credentials and no sample files are needed. On first launch, a guided level explains the game. Then:
- Home > Play: choose a difficulty, then the adventure (level-by-level map).
- Home > Daily challenge: 10 levels, the same for everyone each day.
- Home > Modes: Zen (no timer, no lives), Time attack, Hardcore, Category.
- Home > Wheel: lucky wheel (one free spin per day). Home > Challenge a friend: share a challenge.
- Shop tab: items bought only with in-game coins earned by playing (no real money).
- Settings (gear icon on Home) > Gift code: optional codes that give in-game items, for example POPCORN500 or BIENVENUE.
The app is in 13 languages and follows the device language (it can be changed in Settings > Language).

4. EXTERNAL SERVICES
The app does not use any external service, server, data provider, authentication service, payment processor, analytics, advertising or AI service. All content is included in the app and it works fully offline. It only uses standard Apple frameworks on the device: local notifications (optional daily reminder, scheduled on the device), haptics and the share sheet (to send a challenge to a friend). The Settings screen contains links to the developer's TikTok, Instagram and YouTube pages, opened in the browser.

5. REGIONAL DIFFERENCES
There are no regional differences: the app works the same way in all regions. Only the language of the interface changes, based on the device language.

6. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
The app does not operate in a regulated industry. It does not contain protected third-party material: no images, logos, music, video clips or trademarks are reproduced. Movie, show, brand and place names appear only as plain-text answers to trivia questions, and the emojis are the standard system emoji font of the device.

Best regards,
Hugo Busquet
```
