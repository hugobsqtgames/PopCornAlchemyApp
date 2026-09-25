# Installer Pop-Corn Alchemy sur ton iPhone (version de test)

Ce guide te fait lancer l'app sur ton iPhone avec **Expo Go**, une app gratuite qui sert à tester
avant la publication. Compte 20 minutes la première fois, puis 1 minute les fois suivantes.

Tu as besoin de : ton **Mac**, ton **iPhone**, et les deux sur **le même Wi-Fi**.

---

## Étape 1 — Installer Node.js sur le Mac (une seule fois)

Node.js est le moteur qui fait tourner les outils de l'app.

1. Va sur **https://nodejs.org** et clique sur le gros bouton **LTS** (la version recommandée).
2. Ouvre le fichier `.pkg` téléchargé et clique sur *Continuer* jusqu'à la fin.
3. Vérifie : ouvre l'app **Terminal** (⌘ + Espace, tape « Terminal », Entrée) et tape :

   ```
   node -v
   ```

   Tu dois voir un numéro comme `v22.x.x`. Si c'est le cas, c'est bon.

## Étape 2 — Installer Expo Go sur l'iPhone (une seule fois)

Sur l'iPhone, ouvre l'**App Store**, cherche **Expo Go** et installe-la.

## Étape 3 — Récupérer le code de l'app

1. Sur le Mac, ouvre ce lien dans ton navigateur (connecte-toi à GitHub si on te le demande) :
   **https://github.com/hugobsqtgames/PopCornAlchemyApp/tree/claude/web-to-ios-app-1azlp5**
2. Clique sur le bouton vert **Code**, puis **Download ZIP**.
3. Double-clique sur le ZIP dans *Téléchargements* : un dossier `PopCornAlchemyApp-…` apparaît.

## Étape 4 — Lancer l'app

1. Dans le Terminal, tape `cd ` (avec un espace après), puis **glisse le dossier `mobile`**
   (qui est dans le dossier que tu viens de décompresser) dans la fenêtre du Terminal, puis Entrée.
2. Installe les outils de l'app (1 à 3 minutes, une seule fois) :

   ```
   npm install
   ```

3. Lance l'app :

   ```
   npx expo start
   ```

   Un **QR code** s'affiche dans le Terminal.

## Étape 5 — Ouvrir le jeu sur l'iPhone

1. Ouvre l'app **Appareil photo** de l'iPhone et vise le QR code.
2. Touche la bannière **« Ouvrir dans Expo Go »**.
3. Le jeu se charge (30 secondes la première fois). 🎉

Tant que le Terminal reste ouvert, tu peux rejouer. Pour arrêter : `Ctrl + C` dans le Terminal.

---

## Si ça ne marche pas

| Problème | Solution |
|---|---|
| L'iPhone n'arrive pas à se connecter | Vérifie que le Mac et l'iPhone sont sur le **même Wi-Fi**. Sinon, relance avec `npx expo start --tunnel` |
| « command not found: npx » | Node.js n'est pas installé : refais l'étape 1, puis ferme et rouvre le Terminal |
| Expo Go parle de « SDK » incompatible | Mets Expo Go à jour depuis l'App Store (l'app utilise la version 57 d'Expo) |
| L'écran reste blanc | Secoue l'iPhone → *Reload* |
| Autorisation refusée au premier lancement du Mac | Réglages du Mac → Confidentialité et sécurité → *Autoriser* |

## Ce qui est normal dans cette version de test

Expo Go ne peut pas charger les vrais services d'Apple et de Google. En attendant :

- **Les pubs** sont simulées : une fenêtre « Publicité » de 3 secondes donne la récompense.
- **Les achats** (packs de pièces, pack sans pub) affichent un message : ils arrivent avec la version App Store.
- **Game Center** : le bouton *Classement* montre tes records sur l'appareil.

Tout le reste est réel : les 400 niveaux, les modes, le défi du jour, la roue, la boutique en pièces,
les trophées, les 3 langues, le mode sombre, l'iPad, les sons et les vibrations.

## Mettre à jour après une modification

Quand je pousse des changements, re-télécharge le ZIP (étape 3), refais `npm install` puis
`npx expo start`.

## Prochaine étape : la vraie app

Pour les pubs, les achats, Game Center puis la publication sur l'App Store, il faudra :

1. Créer ton **compte Apple Developer** (99 €/an) sur https://developer.apple.com/programs/
2. Créer un compte gratuit sur **https://expo.dev** (le service qui compile l'app dans le cloud).
3. On branchera ensuite AdMob, les achats intégrés et Game Center, et on générera une version
   installable via **TestFlight**, puis on l'enverra à Apple.
