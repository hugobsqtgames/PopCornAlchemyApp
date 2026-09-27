# Vérification des règles Apple (App Review Guidelines)

Contrôle fait sur la version 1.0, avant le premier envoi. ✅ conforme · ⚠️ à savoir · 📝 à faire le jour de l'envoi.

## 1. Sécurité et contenu

| Règle | État | Détail |
|---|---|---|
| 1.1 Contenu choquant | ✅ | Rien d'offensant. Les emojis d'alcool, de tabac et de cannabis ont été retirés des niveaux (Peaky Blinders, Bob Marley, Oktoberfest, Saint-Patrick, Nouvel An, Bowling, James Bond). |
| Classification par âge | 📝 | **9+** : « Rare ou léger » pour la violence de dessin animé ou fantastique (🔫 ⚔️ de films et jeux) et pour l'horreur / la peur (zombies, Dracula, Scream). « Aucun » pour le reste. |
| 1.3 Catégorie Enfants | ✅ | Ne pas la choisir : l'app est dans Jeux → Mots et Quiz. |

## 2. Performance

| Règle | État | Détail |
|---|---|---|
| 2.1 App complète | ✅ | Aucun bouton qui ne fait rien : achats, pubs et classement sont **cachés** tant qu'ils ne sont pas branchés. La carte « Duel — bientôt » a été retirée (Apple refuse les fonctions « à venir »). |
| 2.1 Plantages | ✅ | 32 tests des règles, 172 vérifications automatiques de tous les écrans, aucune erreur. `expo-asset` ajouté (sans lui, la vraie app pouvait planter). Config validée avec la documentation officielle d'Expo. |
| 2.3 Fiche fidèle | ✅ | Les captures ont été refaites avec cette version. La description ne parle que de ce qui existe. |
| 2.3.1 Fonctions cachées | ✅ | Rien de caché à la vérification d'Apple. |
| 2.5.1 API publiques | ✅ | Uniquement des modules Expo officiels. |
| 2.5.4 / 4.5.4 Notifications | ✅ | Le rappel est **facultatif** : il n'est demandé qu'après le premier défi du jour, il n'est pas publicitaire et il se coupe dans les réglages. |

## 3. Business

| Règle | État | Détail |
|---|---|---|
| 3.1.1 Achats intégrés | ✅ | Aucun achat dans cette version. |
| 3.1.1 Codes cadeaux | ⚠️ | Apple interdit de « débloquer du contenu avec ses propres codes ». Nos codes donnent seulement des pièces et des indices **gratuits**, et rien ne se vend encore : c'est normalement accepté. Si un examinateur le refuse, il suffit de retirer la ligne « Code cadeau » (5 minutes) et de renvoyer. Quand les pièces seront vendues (version 1.1), on vérifiera à nouveau. |
| 3.2.2 Demander une note | ✅ | Uniquement la fenêtre officielle d'Apple, après une victoire, jamais depuis un bouton ni après une question. |

## 4. Design

| Règle | État | Détail |
|---|---|---|
| 4.2 Fonctionnalité minimale | ✅ | Vrai jeu complet : 400 niveaux, 6 modes, défi du jour, trophées, boutique. |
| iPad | ✅ | Mise en page dédiée en portrait et en paysage, captures iPad fournies. |
| Accessibilité | ✅ | Gros texte pris en charge (jusqu'à +30 %, testé écran par écran), option « Réduire les animations » + réglage de l'iPhone respecté, libellés VoiceOver sur les boutons. |

## 5. Juridique

| Règle | État | Détail |
|---|---|---|
| 5.1.1 Politique de confidentialité | 📝 | Page prête (`docs/confidentialite.html`). Activer GitHub Pages, puis coller le lien dans App Store Connect. |
| 5.1.1 Données | ✅ | Aucune donnée collectée → répondre « Données non collectées ». |
| 5.1.2 Suivi publicitaire | ✅ | Pas de pub, pas de traceur : pas de fenêtre de suivi à afficher. |
| 5.2 Propriété intellectuelle | ⚠️ | Les noms de films, marques et YouTubeurs sont écrits en toutes lettres, sans logo ni image : c'est l'usage normal des jeux de quiz. Les mentions légales le précisent. |
| Chiffrement | ✅ | `ITSAppUsesNonExemptEncryption = false` : pas de questionnaire export. |

## Le jour de l'envoi

1. Activer GitHub Pages (voir `FICHE_APP_STORE.md`).
2. Faire un build TestFlight et tester sur ton iPhone : son, musique, vibrations, rappel de 18 h.
3. Remplir la fiche avec `FICHE_APP_STORE.md` et les images de `store/screenshots/`.
4. Âge : 9+ avec les réponses ci-dessus. Confidentialité : « Données non collectées ».
