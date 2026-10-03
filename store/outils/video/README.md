# Aperçu vidéo App Store (App Preview)

Fabrique la vidéo de présentation de Pop-Corn Alchemy à partir de la **vraie app** (version web,
même code que l'iPhone). Rien n'est dessiné à la main : chaque plan est filmé dans l'app, puis
monté (caméra, titres, transitions) et sonorisé avec la musique et les sons du jeu.

Résultat dans `store/apercu/` :

| Fichier | Pour | Format |
|---|---|---|
| `apercu-fr.mp4` | App Store, fiche française | 886 × 1920, 28 s, 30 i/s, H.264 High, AAC stéréo |
| `apercu-en.mp4` | App Store, fiches anglaises | idem |
| `apercu-fr-reseaux.mp4` | TikTok, Instagram, YouTube Shorts (dans un iPhone) | 1080 × 2340 |

## Le storyboard (28 s)

| Temps | Plan | Texte |
|---|---|---|
| 0 – 2,6 s | Gros plan sur « Le Roi Lion », la caméra recule pendant qu'on choisit 🦁 puis 👑, fusion, « BRAVO ! » | Devine-le en emojis. |
| 2,6 – 4,8 s | Niveau suivant (Titanic), même prise continue | Enchaîne les combos. |
| 4,8 – 6,9 s | 5ᵉ bonne réponse : mode Fever (bordure dorée, Popi en feu), zoom sur le badge | Mode Fever, points ×2 |
| 6,9 – 10,4 s | La carte de l'aventure défile des premiers mondes jusqu'à Popi, puis la caméra plonge dedans | 21 mondes à explorer. |
| 10,4 – 12,9 s | Nouvelle partie : les aventures et les 16 catégories | 400 niveaux, 16 catégories. |
| 12,9 – 14,6 s | Le Pop-Cornédex et ses étoiles | Collectionne les 3 étoiles. |
| 14,6 – 16,4 s | Le défi du jour (série, coffre) | Un défi chaque jour. |
| 16,4 – 20,7 s | La roue tourne et donne 100 pièces | Et la roue de la chance. |
| 20,7 – 24 s | Le même niveau, son nom change de langue sous la caméra (13 langues) | 13 langues · Hors ligne · Sans compte |
| 24 – 28 s | Icône de l'app, nom, slogan | Pop-Corn Alchemy · Devine tout en emojis. |

Les couleurs de fond et la police (Rubik) sont celles des captures d'écran de la fiche.
Version App Store : l'écran de l'app flotte sans contour de téléphone (Apple demande que les
aperçus montrent l'app elle-même). Version réseaux : le même montage dans un iPhone.

## Régénérer la vidéo (après un changement dans l'app)

```
# 1. La version web de l'app, servie sur le port 8768 (--clear : sans cache, sinon un réglage
#    de test peut rester dans la version construite)
cd mobile && CI=1 npx expo export --platform web --output-dir /tmp/pca-web --clear && cd ..
node store/outils/video/serve.mjs /tmp/pca-web &

# 2. Filmer (≈ 3 min) : les plans du montage, puis le niveau d'ouverture dans les 13 langues
node store/outils/video/capture.mjs
for l in en es de it pt nl pl tr ru ja ko zh; do APP_LANG=$l ONLY=still node store/outils/video/capture.mjs; done
APP_LANG=en ONLY=play,map,categories,dex,daily,wheel node store/outils/video/capture.mjs   # pour la version anglaise

# 3. Monter et exporter (≈ 3 min par version) — il faut ffmpeg avec libx264
FFMPEG=/chemin/ffmpeg node store/outils/video/render.mjs                 # apercu-fr.mp4
FFMPEG=/chemin/ffmpeg APP_LANG=en node store/outils/video/render.mjs     # apercu-en.mp4
FFMPEG=/chemin/ffmpeg DEVICE=1 node store/outils/video/render.mjs        # apercu-fr-reseaux.mp4

# Vérification rapide sans exporter : une planche d'images clés
SHEET=1 node store/outils/video/render.mjs
```

## Comment ça marche

- `clock.js` remplace l'horloge de la page de l'app : le temps n'avance que quand on le demande,
  1/30 de seconde à la fois. Chaque animation (fusion, confettis, Fever, roue, carte) est donc
  filmée parfaitement fluide, quelle que soit la vitesse de la machine. Le hasard du jeu est fixé
  pour que la grille soit la même dans toutes les langues.
- `capture.mjs` joue l'app comme un joueur (vrais niveaux, vrais boutons) et enregistre chaque image.
- `compose.html` est la table de montage : position de la « caméra » sur l'écran, titres, fonds,
  transitions, image par image.
- `render.mjs` filme `compose.html`, fabrique la bande son (musique du menu + sons du jeu aux
  moments où l'app les joue, tics de la roue, annonce « Fever ! ») et encode le MP4.
