# Publier Pop-Corn Alchemy sur l'App Store — le guide complet

Tout se fait sur https://appstoreconnect.apple.com → **Apps** → **Pop-Corn Alchemy**.
Les textes à copier-coller sont dans `store/FICHE_APP_STORE.md` (une partie par langue).
Les images sont dans `store/screenshots/<langue>/`.
Clique sur **Enregistrer** (en haut à droite) après chaque page.

---

## Partie A — Le français (la langue principale)

### A1. Page « Informations sur l'app » (menu de gauche)
- **Nom** : `Pop-Corn Alchemy`
- **Sous-titre** : `Quiz : devine tout en emojis`
- **Catégorie principale** : Jeux → *Jeux de mots* (Word)
- **Catégorie secondaire** : Jeux → *Quiz* (Trivia)
- **Classification par âge** → « Définir » : « Rare ou léger » pour *Violence de dessin animé ou
  fantastique* et *Horreur / peur*, « Non » / « Aucun » partout ailleurs → tu dois obtenir **9+**.
  Attention à deux pièges qui font passer à 13+ :
  - *Jeux de hasard simulés* → **Aucun** (la roue est un cadeau gratuit, pas un casino) ;
  - *Armes à feu ou autres armes* → **Aucun** (ce ne sont que des emojis dans la grille).
  Publicités → **Non** tant qu'elles ne sont pas activées (à changer pour la version 1.1).
- **Droits sur le contenu** : « Non, elle ne contient pas de contenu tiers ».
- **URL de la politique de confidentialité** :
  `https://hugobsqtgames.github.io/PopCornAlchemyApp/confidentialite.html`

### A2. Page « Tarifs et disponibilité »
- **Prix** : Gratuit (0 €)
- **Disponibilité** : tous les pays

### A3. Page « Confidentialité de l'app »
- « Commencer » → **« Non, nous ne collectons pas de données »** → **Publier**.

### A4. Page de la version « 1.0 Préparation pour la soumission »
- **Captures d'écran** (glisse-les dans l'ordre 01 → 07) :
  - iPhone 6,9 pouces : `store/screenshots/fr/iphone-6.9/`
    (si la case affichée est « Écran de 6,5 pouces » : `store/screenshots/fr/iphone-6.5/`)
  - iPad 13 pouces : `store/screenshots/fr/ipad-13/`
- **Aperçu vidéo** (facultatif, dans la même case que les captures iPhone, zone « aperçus d'app ») :
  glisse `store/apercu/apercu-fr.mp4`. Apple met quelques minutes à la traiter. Clique ensuite sur
  la vidéo → **Image de l'affiche** pour choisir l'image fixe affichée avant la lecture (conseil :
  vers 2,5 s, le « BRAVO ! » sur Le Roi Lion). Pour les fiches en anglais : `store/apercu/apercu-en.mp4`.
- **Texte promotionnel**, **Description**, **Mots-clés** : partie 🇫🇷 de `FICHE_APP_STORE.md`.
- **URL d'assistance** : `https://hugobsqtgames.github.io/PopCornAlchemyApp/`
- **Copyright** : `© 2026 Hugo_BSQT`
- **Build** : « Ajouter un build » → **1.0.0 (1)**.
  (Pas de champ « Nouveautés » pour une première version : c'est normal.)
- **Informations pour la vérification** :
  - Connexion requise : **décochée**
  - Coordonnées : ton nom, ton téléphone, ton e-mail (seul Apple les voit)
  - Notes : `No account needed. The app works fully offline. Optional gift codes for testing: POPCORN500, BIENVENUE.`
- **Publication de la version** : « Publier automatiquement cette version ».

---

## Partie B — Ajouter les 12 autres langues

À faire **avant** d'envoyer à Apple (partie C) si tu veux que la fiche soit traduite dès la sortie.
Tu peux aussi le faire plus tard, avec une mise à jour : sans ces langues, l'app s'affiche quand même
dans la langue du téléphone ; seule la fiche de l'App Store reste en français.

### B1. Ajouter une langue (une fois par langue)
1. Va sur la page de la version (1.0).
2. En haut à droite de la page, clique sur le menu de langue **« Français ▾ »**.
3. Clique sur **« Ajouter une langue »** (ou « + ») et choisis la langue (tableau plus bas).
4. La page passe dans cette langue : les cases sont vides, c'est normal.

### B2. Remplir la langue — deux pages à faire pour chacune
**Page de la version** (la langue choisie en haut à droite) :
- **Captures d'écran** : iPhone 6,9 pouces et iPad 13 pouces depuis le dossier de la langue.
  (Si tu n'en mets pas, Apple reprend les images françaises.)
- **Texte promotionnel**, **Description**, **Mots-clés** : partie de la langue dans `FICHE_APP_STORE.md`.
- **URL d'assistance** : `https://hugobsqtgames.github.io/PopCornAlchemyApp/`
- → **Enregistrer**.

**Page « Informations sur l'app »** (choisis la même langue dans le menu en haut à droite) :
- **Nom** : `Pop-Corn Alchemy` (le même partout)
- **Sous-titre** : celui de la langue (tableau ci-dessous)
- **URL de la politique de confidentialité** :
  `https://hugobsqtgames.github.io/PopCornAlchemyApp/confidentialite.html`
- → **Enregistrer**.

### B3. Les langues à ajouter

| Langue dans App Store Connect | Partie de `FICHE_APP_STORE.md` | Captures | Sous-titre |
|---|---|---|---|
| Anglais (États-Unis) | 🇬🇧 English | `en/` | Emoji quiz: guess everything |
| Anglais (Royaume-Uni) | 🇬🇧 English (les mêmes textes) | `en/` | Emoji quiz: guess everything |
| Espagnol (Espagne) | 🇪🇸 Español | `es/` | Quiz: adivina todo con emojis |
| Espagnol (Mexique) | 🇪🇸 Español (les mêmes textes) | `es/` | Quiz: adivina todo con emojis |
| Allemand | 🇩🇪 Deutsch | `de/` | Emoji-Quiz: Errate alles! |
| Italien | 🇮🇹 Italiano | `it/` | Quiz: indovina tutto con emoji |
| Portugais (Brésil) | 🇧🇷 Português | `pt/` | Quiz: adivinhe tudo com emojis |
| Néerlandais | 🇳🇱 Nederlands | `nl/` | Emoji-quiz: raad alles! |
| Polonais | 🇵🇱 Polski | `pl/` | Quiz: zgadnij wszystko z emoji |
| Turc | 🇹🇷 Türkçe | `tr/` | Emoji quiz: her şeyi tahmin et |
| Russe | 🇷🇺 Русский | `ru/` | Эмодзи-квиз: угадай всё! |
| Japonais | 🇯🇵 日本語 | `ja/` | 絵文字クイズ：なんでも当てよう |
| Coréen | 🇰🇷 한국어 | `ko/` | 이모지 퀴즈: 뭐든지 맞혀 봐 |
| Chinois (simplifié) | 🇨🇳 简体中文 | `zh/` | 表情猜谜：什么都能猜 |

Les captures sont dans `store/screenshots/<dossier>/iphone-6.9/` et `store/screenshots/<dossier>/ipad-13/`.

### B4. Astuces
- Fais une langue à la fois, en entier (les deux pages), puis passe à la suivante.
- Ouvre `FICHE_APP_STORE.md` sur GitHub dans un onglet, et App Store Connect dans un autre :
  sélectionne le texte à la souris, copie, colle.
- Si Apple dit qu'un champ est trop long, dis-le-moi : je raccourcis le texte.
- Un point rouge à côté d'une langue = une case obligatoire est vide (souvent le Nom ou la Description).

---

## Partie C — Envoyer à Apple

1. Vérifie qu'aucune langue n'a de point rouge.
2. Clique sur **« Ajouter pour vérification »** (en haut à droite).
3. Clique sur **« Soumettre à App Review »**.
4. Apple vérifie en général en 1 à 3 jours ; tu reçois un e-mail à chaque étape.

**Le nom « Hugo Anselme BUSQUET »** : pour sortir directement avec « Hugo BUSQUET », attends la réponse
du support Apple avant de soumettre. Sinon, publie maintenant : le nom sera corrigé plus tard.

**Si Apple refuse** : tu reçois un message dans App Store Connect (« Résolution Center »).
Envoie-le-moi : on corrige et on renvoie.
