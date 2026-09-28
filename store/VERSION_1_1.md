# Version 1.1 : pubs, achats intégrés et sauvegarde iCloud

Le code est prêt mais **éteint** : `MONEY_READY = false` dans `mobile/src/services/store-services.ts`.
Tant qu'il est éteint, aucun bouton payant ni aucune pub n'apparaît.

## ⚠️ Les modules de la 1.1 sont mis de côté

La **version 1.0** (avec la carte et Popi) se construit directement depuis la branche : les
parties natives de la 1.1 en ont été retirées par le commit **`a8fb48e`**, pour que l'app 1.0 ne
contienne ni le SDK Google ni iCloud (« Données non collectées » sans risque). Tout le reste du
code de la 1.1 est là, éteint.

**Pour commencer la 1.1**, une fois la 1.0 envoyée à Apple :

```bash
git revert a8fb48e          # remet expo-iap, AdMob, le suivi Apple, le module iCloud et ses droits
cd mobile && npm install    # réinstalle les 3 bibliothèques
```

Le `git revert` va buter sur `mobile/app.json` et `mobile/locales/*.json`, modifiés depuis pour la
langue automatique de la 1.0. Pour résoudre :

- `mobile/locales/fr|en|es.json` : garder `CFBundleDisplayName` et ajouter la clé
  `NSUserTrackingUsageDescription` de la 1.1 dans le bloc `"ios"` (le texte est dans `git show a8fb48e`).
- `mobile/app.json` : garder le bloc `locales` et le plugin `expo-localization` avec ses
  `supportedLocales`, et reprendre de la 1.1 les plugins (expo-iap, AdMob, suivi), les droits iCloud et
  `CFBundleAllowMixedLocalizations`.

Puis `npx tsc --noEmit`, `npm test` et `bash tests-e2e/run.sh` avant tout build.

## Ce que fait le code

| Où | Quoi |
|---|---|
| Boutique → Pièces | 4 packs (0,99 € à 9,99 €) et le « Pack sans pub » (3,99 €). Prix affichés dans la monnaie du joueur, venus de l'App Store. |
| Boutique, roue, game over | Pubs vidéo à récompense (jamais imposées) : +25 💰 (5 par jour), tour de roue bonus, continuer avec 1 vie. |
| Pack sans pub | Les récompenses des pubs arrivent **sans regarder la pub**, + 1 000 💰. |
| Réglages | « Supprimer les pubs », « Restaurer mes achats » et, en Europe, « Mes choix pour les pubs ». |
| Sécurité | Un achat n'est jamais payé deux fois (même si l'app se ferme pendant l'achat). Le pack sans pub survit à « Réinitialiser ». |
| Consentement | Formulaire européen de Google (RGPD), puis la question d'Apple « Autoriser le suivi ? », au premier visionnage d'une pub (pas au lancement). |

Fichiers : `mobile/src/services/money.native.ts` (App Store + AdMob), `money-config.ts` (identifiants
AdMob), `store-services.ts` (l'interrupteur), `mobile/src/game/catalog.ts` (packs et prix).

## Sauvegarde iCloud (même progression sur iPhone et iPad)

Toujours active dans la 1.1, rien à régler pour le joueur (Réglages → « ☁️ Sauvegarde iCloud ✓ »).

- Utilise le **stockage clé-valeur iCloud** du compte Apple du joueur : gratuit, sans compte ni
  serveur à nous. Module maison : `mobile/modules/cloud-kv` (Swift). Envoi 3 s après chaque
  changement et à la sortie de l'app ; lecture au lancement, au retour dans l'app et dès qu'un
  autre appareil change quelque chose.
- Règles de fusion (`mobile/src/store/cloud-merge.ts`, testées) :
  - s'additionnent : réponses trouvées, meilleures étoiles, trophées, records, statistiques,
    thèmes/styles/avatars possédés, codes utilisés, achats ;
  - viennent de l'appareil qui a joué en dernier : pièces, indices, bonus, partie en cours,
    thème choisi (plus les pièces d'un pack acheté sur l'autre appareil, jamais perdues) ;
  - suivent la date la plus récente : défi du jour, roue, cadeau du jour (impossible de
    prendre un cadeau deux fois en changeant d'appareil) ;
  - un appareil neuf (0 niveau réussi) ne remplace jamais une vraie progression ;
  - « Réinitialiser » s'applique à tous les appareils, sauf les achats.
  - Restent propres à chaque appareil : langue, sons, musique, vibrations, animations, voix,
    rappel.
- Confidentialité : les données vont dans l'iCloud **du joueur**, nous n'y avons pas accès.
  Ce n'est pas une « collecte » au sens d'Apple.
- EAS active tout seul l'option iCloud de l'app chez Apple au premier build (conteneur
  `iCloud.com.hugobsqt.popcornalchemy`). Si le build se plaint des « capabilities », il suffit
  de relancer : ça arrive parfois au premier essai.
- **Pas testable ici** : il faut deux appareils Apple avec le même compte iCloud (iPhone + iPad),
  via TestFlight.

## Ce que Hugo doit faire (une seule fois)

### App Store Connect (appstoreconnect.apple.com)
1. **Accords, taxes et banques** → signer l'accord « Apps payantes », remplir le compte bancaire et
   les formulaires fiscaux. Sans ça, aucun achat ne marche.
2. **Small Business Program** (developer.apple.com/app-store/small-business-program) → s'inscrire :
   Apple prend 15 % au lieu de 30 %.
3. **Mon app → Achats intégrés** → créer ces 5 produits, avec exactement ces identifiants :

| Identifiant du produit | Type | Prix |
|---|---|---|
| `com.hugobsqt.popcornalchemy.coins_500` | Consommable | 0,99 € |
| `com.hugobsqt.popcornalchemy.coins_1200` | Consommable | 1,99 € |
| `com.hugobsqt.popcornalchemy.coins_3500` | Consommable | 4,99 € |
| `com.hugobsqt.popcornalchemy.coins_8000` | Consommable | 9,99 € |
| `com.hugobsqt.popcornalchemy.no_ads` | Non consommable | 3,99 € |

   Pour chacun : un nom et une description en FR/EN/ES, et une capture d'écran de la boutique
   (Apple la demande pour vérifier).
4. **Utilisateurs et accès → Sandbox** → créer un compte de test pour acheter sans payer.

### Google AdMob (apps.admob.com, gratuit)
1. Créer le compte, remplir les infos de paiement.
2. Ajouter l'app « Pop-Corn Alchemy » (iOS) → noter l'**identifiant de l'app** (`ca-app-pub-…~…`).
3. Créer un bloc d'annonces **« Avec récompense »** → noter son identifiant (`ca-app-pub-…/…`).
4. **Confidentialité et messages** → créer le message RGPD (Europe) et le message IDFA (iOS).
5. Me donner les 2 identifiants (ce ne sont pas des secrets, ils sont visibles dans toute app).

## Ce que je fais ensuite
1. Mettre les vrais identifiants AdMob dans `app.json` (`iosAppId`) et `money-config.ts`.
   Tant qu'ils sont vides, ce sont les **pubs de test de Google** : parfait pour TestFlight,
   interdit sur l'App Store.
2. Ajouter la liste complète des identifiants SKAdNetwork de Google dans `app.json`.
3. Passer `MONEY_READY` à `true`, version `1.1.0`, lancer le build EAS → TestFlight.
4. Tests sur ton iPhone avec le compte Sandbox : chaque pack, sans pub, restaurer, pubs, refuser le suivi.
   Puis iCloud : jouer sur l'iPhone, ouvrir l'iPad (même compte iCloud), vérifier pièces et niveaux.
5. Mettre à jour la page de confidentialité et la fiche (ci-dessous), envoyer à Apple.

## Le jour de l'envoi de la 1.1

- **Confidentialité de l'app** : ce n'est plus « Données non collectées ». Déclarer ce que collecte
  le SDK Google Mobile Ads, en suivant la page officielle de Google
  (developers.google.com/admob/ios/privacy/data-disclosure) : en général identifiants (appareil),
  données d'utilisation (interactions, données publicitaires), diagnostics, localisation approximative,
  utilisés pour la publicité de tiers et les statistiques. « Suivi » : oui.
- **Classification par âge** : répondre « Oui » à « Publicités ».
- **Notes pour l'examinateur** (App Review Information) : « The App Tracking Transparency prompt
  appears the first time an ad is watched: Shop → +25 free coins. In-app purchases: Shop → Coins. »
- **Page de confidentialité** (`docs/confidentialite.html`) : remplacer « Cette version n'a ni publicité
  ni achat intégré » par un paragraphe sur les pubs Google AdMob (données, consentement, lien vers
  policies.google.com/privacy) et sur les achats (gérés par Apple, l'app ne voit aucune donnée bancaire).
- **Fiche App Store** : Prix « Gratuit » avec achats intégrés, et retirer « sans pub » des textes.
- **Codes cadeaux** (règle 3.1.1) : maintenant que les pièces se vendent, le risque de refus
  augmente. Si Apple refuse, retirer la ligne « Code cadeau » des réglages.
