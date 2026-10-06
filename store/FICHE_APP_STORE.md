# Fiche App Store — Pop-Corn Alchemy

Tout ce qu'il faut copier-coller dans **App Store Connect** (appstoreconnect.apple.com → Mes apps → Pop-Corn Alchemy).
Les limites de caractères d'Apple sont indiquées entre parenthèses et sont toutes respectées.

## Informations générales (une seule fois)

| Champ | Valeur |
|---|---|
| Nom de l'app (30) | Pop-Corn Alchemy |
| Identifiant du paquet | com.hugobsqt.popcornalchemy |
| Langue principale | Français (l'app est en 13 langues, voir plus bas) |
| Catégorie principale | Jeux → Jeux de mots (*Word*) |
| Catégorie secondaire | Jeux → Quiz (*Trivia*) |
| Prix | Gratuit. Version 1.0 : ni achat ni pub. À partir de la 1.1 : achats intégrés (packs de pièces, pack sans pub) et pubs vidéo facultatives |
| Droits d'auteur | © 2026 Hugo_BSQT |
| Classification par âge | **9+** : répondre « Rare ou léger » à *Violence de dessin animé ou fantastique* (armes de films et jeux : 🔫 ⚔️) et à *Horreur / peur* (zombies, Dracula, Scream), « Aucun » partout ailleurs, y compris *Jeux de hasard simulés* (la roue n'est pas un casino) et *Armes* (simples emojis). Publicités : non (à changer quand elles seront activées) |
| URL d'assistance | https://hugobsqtgames.github.io/PopCornAlchemyApp/ |
| URL de politique de confidentialité | https://hugobsqtgames.github.io/PopCornAlchemyApp/confidentialite.html |

Les deux liens ci-dessus marchent une fois GitHub Pages activé (une seule fois, 1 minute) : sur GitHub, dépôt
PopCornAlchemyApp → **Settings** → **Pages** → *Source* : « Deploy from a branch » → branche
`claude/web-to-ios-app-1azlp5`, dossier **`/docs`** → **Save**. Les pages sont dans `docs/`.

**Confidentialité de l'app (« App Privacy »)** : *« Données non collectées »*. Quand les vraies pubs et Game Center
seront branchés, il faudra déclarer « Identifiants (publicité) » et « Données d'utilisation » : je te guiderai.

**Codes cadeaux** : ils sont dans `mobile/src/game/codes.ts` (POPCORN500, BIENVENUE, TIKTOK). Pour en ajouter un,
il faut une mise à jour de l'app.

## Captures d'écran

Dans `store/screenshots/` : 7 images par langue et par appareil, déjà aux tailles demandées par Apple.

| Dossier | Taille | Où les mettre |
|---|---|---|
| `<langue>/iphone-6.9/` | 1320 × 2868 | iPhone 6,9 pouces (sert aussi pour tous les autres iPhone) |
| `<langue>/iphone-6.5/` | 1284 × 2778 | iPhone 6,5 pouces (si App Store Connect demande cette taille-là) |
| `<langue>/ipad-13/` | 2064 × 2752 | iPad 13 pouces |

13 langues : `fr`, `en`, `es`, `de`, `it`, `pt` (à mettre dans « Portugais (Brésil) »), `nl`, `pl`, `tr`, `ru`, `ja`,
`ko`, `zh` (à mettre dans « Chinois simplifié »). Dans App Store Connect, ajoute chaque langue avec
**« + » à côté de la langue** en haut de la page de la version, puis colle ses textes (plus bas) et ses images.

Glisse-les dans l'ordre 01 → 07. Pour les refaire après un changement : `store/outils/screenshots.mjs`.

---

## 🇫🇷 Français

**Sous-titre (30)**
Quiz : devine tout en emojis

**Texte promotionnel (170)**
400 niveaux, 16 catégories et 3 difficultés : combine les bons emojis pour retrouver films, séries, pays ou marques. Un nouveau défi chaque jour !

**Description (4000)**
Un lion + une couronne ? Le Roi Lion !

Pop-Corn Alchemy est le jeu de devinettes en emojis qui fait chauffer les neurones. Chaque niveau te donne un nom — un film, une série, un pays, un plat, une marque… — et une grille de 20 emojis. À toi de trouver ceux qui vont ensemble et de les fusionner !

400 NIVEAUX, 16 CATÉGORIES
Films, séries, jeux vidéo, musique, pays, monuments, sport, métiers, contes, maison, fêtes, cuisine, marques, nature, anime et YouTubeurs.

FACILE, MOYEN OU DIFFICILE
Choisis ton aventure : les grands classiques pour commencer en douceur, ou les références les plus pointues pour les experts.

COMBOS ET MODE FEVER
Réponds vite pour gagner plus de points. Enchaîne 5 bonnes réponses et déclenche le mode Fever : tous tes points sont doublés !

UN DÉFI CHAQUE JOUR
10 niveaux mystère, les mêmes pour tout le monde. Garde ta série de jours et ouvre un coffre tous les 7 jours.

JAMAIS BLOQUÉ
Révèle un emoji, retire 5 intrus ou mélange la grille. Et si tu rates, tu perds une vie et tu retentes le même niveau jusqu'à trouver.

PLUSIEURS MODES
• Classique : l'aventure palier par palier
• Zen : sans chrono ni vies, juste pour le plaisir
• Chrono : un maximum de niveaux en 60 secondes
• Hardcore : une seule vie, pièces doublées
• Catégorie : joue seulement ce que tu aimes

DÉFIE TES AMIS
Envoie tes 5 derniers niveaux et ton score : tes amis doivent faire mieux.

3 ÉTOILES ET LE POP-CORNÉDEX
Chaque réponse trouvée rejoint ton album, rangé par catégorie. Rejoue tes niveaux pour décrocher les 3 étoiles : sans indice, sans erreur et en vitesse !

LA CARTE DE L'AVENTURE
Avance niveau par niveau sur un chemin, palier après palier, avec Popi, la mascotte pop-corn qui réagit à chacune de tes réponses. Ta progression est gardée : un game over ne te renvoie jamais au début.

ET AUSSI
Un cadeau chaque jour, la roue de la chance, des protections de série, un rappel du défi du jour, des boucliers et passe-niveaux, des thèmes et des styles à débloquer, un arbre de 46 trophées, tes statistiques, un mode sombre, et une version pensée pour iPad.

Jouable hors ligne, sans compte, en 13 langues.

**Mots-clés (100)**
devinette,film,série,culture,rébus,énigme,trivia,mots,cinéma,pays,logo,marque,sport,charade,anime

**Nouveautés de cette version (4000)**
Première version de Pop-Corn Alchemy ! 400 niveaux, 16 catégories, 3 difficultés, un mode Zen, un défi par jour et la roue de la chance. Bon jeu

---

## 🇬🇧 English (U.S. et U.K.)

**Subtitle (30)**
Emoji quiz: guess everything

**Promotional text (170)**
400 levels, 16 categories and 3 difficulty levels: combine the right emojis to find movies, TV shows, countries and brands. A new challenge every day!

**Description (4000)**
A lion + a crown? The Lion King!

Pop-Corn Alchemy is the emoji guessing game that gets your brain popping. Each level gives you a name — a movie, a TV show, a country, a dish, a brand… — and a grid of 20 emojis. Find the ones that go together and fuse them!

400 LEVELS, 16 CATEGORIES
Movies, TV shows, video games, music, countries, landmarks, sports, jobs, fairy tales, home, holidays, food, brands, nature, anime and YouTubers.

EASY, MEDIUM OR HARD
Pick your adventure: the big classics to start gently, or the trickiest references for experts.

COMBOS AND FEVER MODE
Answer fast to score more. Get 5 right in a row to trigger Fever mode: all your points are doubled!

A NEW CHALLENGE EVERY DAY
10 mystery levels, the same for everyone. Keep your streak going and open a chest every 7 days.

NEVER STUCK
Reveal an emoji, remove 5 wrong ones or shuffle the grid. And if you miss, you lose a life and try the same level again until you get it.

SEVERAL MODES
• Classic: the adventure, tier by tier
• Zen: no clock, no lives, just for fun
• Time attack: as many levels as you can in 60 seconds
• Hardcore: one life, double coins
• Category: play only what you love

CHALLENGE YOUR FRIENDS
Send your last 5 levels and your score: your friends have to beat it.

3 STARS AND THE POP-CORNÉDEX
Every answer you find joins your album, sorted by category. Replay your levels to earn all 3 stars: no clue, no mistake, and fast!

THE ADVENTURE MAP
Move forward level by level along a path, tier after tier, with Popi, the pop-corn mascot who reacts to every answer. Your progress is saved: a game over never sends you back to the start.

AND MORE
A gift every day, the lucky wheel, streak freezes, a daily challenge reminder, shields and skips, themes and styles to unlock, a tree of 46 trophies, your stats, dark mode, and a layout made for iPad.

Plays offline, no account needed, in 13 languages.

**Keywords (100)**
movie,trivia,puzzle,riddle,word,film,tv,show,brain,logo,country,pop,culture,charades,rebus,anime

**What's New (4000)**
The first version of Pop-Corn Alchemy! 400 levels, 16 categories, 3 difficulty levels, a Zen mode, a daily challenge and the lucky wheel. Have fun

---

## 🇪🇸 Español (España et México)

**Subtítulo (30)**
Quiz: adivina todo con emojis

**Texto promocional (170)**
400 niveles, 16 categorías y 3 dificultades: combina los emojis correctos para encontrar películas, series, países o marcas. ¡Un reto nuevo cada día!

**Descripción (4000)**
¿Un león + una corona? ¡El Rey León!

Pop-Corn Alchemy es el juego de adivinanzas con emojis que pone a prueba tu cerebro. Cada nivel te da un nombre —una película, una serie, un país, un plato, una marca…— y una cuadrícula de 20 emojis. ¡Encuentra los que van juntos y fusiónalos!

400 NIVELES, 16 CATEGORÍAS
Películas, series, videojuegos, música, países, monumentos, deportes, oficios, cuentos, casa, fiestas, cocina, marcas, naturaleza, anime y YouTubers.

FÁCIL, NORMAL O DIFÍCIL
Elige tu aventura: los grandes clásicos para empezar con calma, o las referencias más difíciles para expertos.

COMBOS Y MODO FEVER
Responde rápido para ganar más puntos. Encadena 5 aciertos y activa el modo Fever: ¡todos tus puntos se duplican!

UN RETO NUEVO CADA DÍA
10 niveles misteriosos, los mismos para todos. Mantén tu racha y abre un cofre cada 7 días.

NUNCA ATASCADO
Revela un emoji, quita 5 falsos o mezcla la cuadrícula. Y si fallas, pierdes una vida y vuelves a intentar el mismo nivel hasta acertar.

VARIOS MODOS
• Clásico: la aventura, etapa por etapa
• Zen: sin reloj ni vidas, solo por diversión
• Contrarreloj: el máximo de niveles en 60 segundos
• Hardcore: una sola vida, monedas dobles
• Categoría: juega solo lo que te gusta

RETA A TUS AMIGOS
Envía tus 5 últimos niveles y tu puntuación: tus amigos tendrán que superarla.

3 ESTRELLAS Y EL POP-CORNÉDEX
Cada respuesta que encuentras entra en tu álbum, ordenada por categoría. Repite tus niveles para conseguir las 3 estrellas: sin pistas, sin errores y rápido.

EL MAPA DE LA AVENTURA
Avanza nivel a nivel por un camino, etapa tras etapa, con Popi, la mascota de palomitas que reacciona a cada respuesta. Tu progreso se guarda: un game over nunca te devuelve al principio.

Y ADEMÁS
Un regalo cada día, la ruleta de la suerte, protectores de racha, un recordatorio del reto diario, escudos y saltos de nivel, temas y estilos para desbloquear, un árbol de 46 trofeos, tus estadísticas, modo oscuro y una versión pensada para iPad.

Se juega sin conexión, sin cuenta, en 13 idiomas.

**Palabras clave (100)**
adivinanza,película,serie,trivia,acertijo,palabras,cine,país,logo,marca,cultura,juego,charada,anime

**Novedades (4000)**
¡La primera versión de Pop-Corn Alchemy! 400 niveles, 16 categorías, 3 dificultades, un modo Zen, un reto diario y la ruleta de la suerte. ¡A jugar!

---

## 🇩🇪 Deutsch (`de`)

**Subtitle (30)**
Emoji-Quiz: Errate alles!

**Promotional text (170)**
400 Levels, 16 Kategorien und 3 Schwierigkeitsstufen: Kombiniere die richtigen Emojis und finde Filme, Serien, Länder und Marken. Jeden Tag eine neue Challenge!

**Description (4000)**
Ein Löwe + eine Krone? Der König der Löwen!

Pop-Corn Alchemy ist das Emoji-Ratespiel, das dein Hirn zum Poppen bringt. Jedes Level zeigt dir einen Namen – einen Film, eine Serie, ein Land, ein Gericht, eine Marke … – und ein Raster aus 20 Emojis. Finde die passenden und verschmelze sie!

400 LEVELS, 16 KATEGORIEN
Filme, Serien, Videospiele, Musik, Länder, Wahrzeichen, Sport, Berufe, Märchen, Zuhause, Feste, Essen, Marken, Natur, Anime und YouTuber.

LEICHT, MITTEL ODER SCHWER
Wähle dein Abenteuer: die großen Klassiker für einen sanften Start oder die kniffligsten Begriffe für Profis.

COMBOS UND FEVER-MODUS
Antworte schnell für mehr Punkte. 5 richtige Antworten in Folge lösen den Fever-Modus aus: alle Punkte zählen doppelt!

JEDEN TAG EINE NEUE CHALLENGE
10 geheime Levels, für alle gleich. Halte deine Serie und öffne alle 7 Tage eine Truhe.

NIE FESTGEFAHREN
Decke ein Emoji auf, entferne 5 falsche oder mische das Raster. Und wenn du danebenliegst, verlierst du ein Leben und versuchst dasselbe Level erneut, bis du es hast.

MEHRERE MODI
• Klassisch: das Abenteuer, Etappe für Etappe
• Zen: ohne Uhr, ohne Leben, einfach zum Spaß
• Zeitrennen: so viele Levels wie möglich in 60 Sekunden
• Hardcore: ein Leben, doppelte Münzen
• Kategorie: spiel nur, was du liebst

FORDERE DEINE FREUNDE HERAUS
Schick deine letzten 5 Levels und deine Punkte: Deine Freunde müssen dich schlagen.

3 STERNE UND DER POP-CORNÉDEX
Jede gefundene Antwort landet in deinem Album, sortiert nach Kategorie. Spiel deine Levels nochmal für alle 3 Sterne: ohne Hilfe, ohne Fehler und schnell!

DIE ABENTEUERKARTE
Geh Level für Level einen Weg entlang, durch 21 Welten mit eigener Landschaft, zusammen mit Popi, dem Popcorn-Maskottchen, das auf jede Antwort reagiert. Dein Fortschritt bleibt gespeichert.

UND NOCH MEHR
Ein Geschenk pro Tag, das Glücksrad, Serienschutz, Erinnerung an die Challenge, Schilde und Level-Pässe, Designs und Stile zum Freischalten, ein Baum mit 46 Trophäen, deine Statistiken, Dunkelmodus und ein Layout fürs iPad.

Offline spielbar, ohne Konto, in 13 Sprachen.

**Keywords (100)**
raten,film,rätsel,wort,serie,logo,land,popcorn,denkspiel,wissen,rätselspiel,marke,kino,anime,trivia

**What's New (4000)**
Die erste Version von Pop-Corn Alchemy! 400 Levels, 16 Kategorien, 3 Schwierigkeitsstufen, eine Abenteuerkarte mit 21 Welten, ein Zen-Modus, eine tägliche Challenge und das Glücksrad. Viel Spaß

---

## 🇮🇹 Italiano (`it`)

**Subtitle (30)**
Quiz: indovina tutto con emoji

**Promotional text (170)**
400 livelli, 16 categorie e 3 difficoltà: combina gli emoji giusti per trovare film, serie TV, paesi e marchi. Una nuova sfida ogni giorno!

**Description (4000)**
Un leone + una corona? Il re leone!

Pop-Corn Alchemy è il gioco di indovinelli con gli emoji che fa scoppiettare il cervello. Ogni livello ti dà un nome – un film, una serie, un paese, un piatto, un marchio… – e una griglia di 20 emoji. Trova quelli giusti e fondili!

400 LIVELLI, 16 CATEGORIE
Film, serie TV, videogiochi, musica, paesi, monumenti, sport, mestieri, fiabe, casa, feste, cibo, marchi, natura, anime e YouTuber.

FACILE, MEDIO O DIFFICILE
Scegli la tua avventura: i grandi classici per iniziare con calma o i riferimenti più difficili per gli esperti.

COMBO E MODALITÀ FEVER
Rispondi veloce per fare più punti. 5 risposte giuste di fila attivano la modalità Fever: tutti i punti raddoppiano!

UNA NUOVA SFIDA OGNI GIORNO
10 livelli misteriosi, uguali per tutti. Mantieni la serie e apri un forziere ogni 7 giorni.

MAI BLOCCATO
Rivela un emoji, togline 5 sbagliati o mescola la griglia. E se sbagli, perdi una vita e riprovi lo stesso livello finché non indovini.

TANTE MODALITÀ
• Classica: l'avventura, tappa dopo tappa
• Zen: senza tempo, senza vite, solo per divertirsi
• A tempo: più livelli possibile in 60 secondi
• Hardcore: una vita, monete doppie
• Categoria: gioca solo quello che ami

SFIDA I TUOI AMICI
Invia i tuoi ultimi 5 livelli e il tuo punteggio: i tuoi amici devono batterlo.

3 STELLE E IL POP-CORNÉDEX
Ogni risposta trovata entra nel tuo album, ordinata per categoria. Rigioca i livelli per le 3 stelle: senza aiuti, senza errori e veloce!

LA MAPPA DELL'AVVENTURA
Avanza livello dopo livello lungo un sentiero, attraverso 21 mondi con il loro paesaggio, insieme a Popi, la mascotte popcorn che reagisce a ogni risposta. I progressi restano salvati.

E ALTRO ANCORA
Un regalo ogni giorno, la ruota della fortuna, i salva-serie, il promemoria della sfida, scudi e salta-livello, temi e stili da sbloccare, un albero di 46 trofei, le tue statistiche, la modalità scura e un layout pensato per iPad.

Si gioca offline, senza account, in 13 lingue.

**Keywords (100)**
film,indovinello,parole,serie,logo,paese,popcorn,cervello,cultura,marchio,cinema,anime,trivia,rebus

**What's New (4000)**
La prima versione di Pop-Corn Alchemy! 400 livelli, 16 categorie, 3 difficoltà, una mappa con 21 mondi, una modalità Zen, una sfida del giorno e la ruota della fortuna. Buon divertimento

---

## 🇧🇷 Português (Brasil) (`pt-BR`)

**Subtitle (30)**
Quiz: adivinhe tudo com emojis

**Promotional text (170)**
400 níveis, 16 categorias e 3 dificuldades: combine os emojis certos para descobrir filmes, séries, países e marcas. Um desafio novo todo dia!

**Description (4000)**
Um leão + uma coroa? O Rei Leão!

Pop-Corn Alchemy é o jogo de adivinhar com emojis que faz seu cérebro estourar. Cada nível mostra um nome – um filme, uma série, um país, um prato, uma marca… – e uma grade de 20 emojis. Encontre os certos e funda!

400 NÍVEIS, 16 CATEGORIAS
Filmes, séries, videogames, música, países, monumentos, esportes, profissões, contos, casa, festas, comida, marcas, natureza, anime e YouTubers.

FÁCIL, MÉDIO OU DIFÍCIL
Escolha sua aventura: os grandes clássicos para começar de leve ou as referências mais difíceis para especialistas.

COMBOS E MODO FEVER
Responda rápido para marcar mais. 5 acertos seguidos ativam o modo Fever: todos os pontos em dobro!

UM DESAFIO NOVO TODO DIA
10 níveis misteriosos, iguais para todos. Mantenha sua sequência e abra um baú a cada 7 dias.

NUNCA TRAVADO
Revele um emoji, tire 5 errados ou embaralhe a grade. E se errar, você perde uma vida e tenta o mesmo nível de novo até acertar.

VÁRIOS MODOS
• Clássico: a aventura, etapa por etapa
• Zen: sem relógio, sem vidas, só por diversão
• Contra o tempo: o máximo de níveis em 60 segundos
• Hardcore: uma vida, moedas em dobro
• Categoria: jogue só o que você ama

DESAFIE SEUS AMIGOS
Envie seus últimos 5 níveis e sua pontuação: seus amigos precisam bater.

3 ESTRELAS E O POP-CORNÉDEX
Cada resposta encontrada entra no seu álbum, por categoria. Jogue de novo para ganhar as 3 estrelas: sem dica, sem erro e rápido!

O MAPA DA AVENTURA
Avance nível por nível num caminho, por 21 mundos com paisagens próprias, com Popi, o mascote pipoca que reage a cada resposta. Seu progresso fica salvo.

E MAIS
Um presente por dia, a roleta da sorte, protetores de sequência, lembrete do desafio, escudos e passes de nível, temas e estilos para desbloquear, uma árvore de 46 troféus, suas estatísticas, modo escuro e um layout feito para iPad.

Funciona offline, sem conta, em 13 idiomas.

**Keywords (100)**
adivinhar,filme,charada,palavra,série,logo,país,pipoca,cérebro,cultura,jogo,marca,cinema,anime

**What's New (4000)**
A primeira versão de Pop-Corn Alchemy! 400 níveis, 16 categorias, 3 dificuldades, um mapa com 21 mundos, um modo Zen, um desafio do dia e a roleta da sorte. Divirta-se

---

## 🇳🇱 Nederlands (`nl`)

**Subtitle (30)**
Emoji-quiz: raad alles!

**Promotional text (170)**
400 levels, 16 categorieën en 3 moeilijkheden: combineer de juiste emoji's om films, series, landen en merken te vinden. Elke dag een nieuwe uitdaging!

**Description (4000)**
Een leeuw + een kroon? De Leeuwenkoning!

Pop-Corn Alchemy is het emoji-raadspel dat je hersens laat poppen. Elk level geeft je een naam – een film, een serie, een land, een gerecht, een merk… – en een raster van 20 emoji's. Vind de juiste en fuseer ze!

400 LEVELS, 16 CATEGORIEËN
Films, series, videogames, muziek, landen, monumenten, sport, beroepen, sprookjes, thuis, feesten, eten, merken, natuur, anime en YouTubers.

MAKKELIJK, GEMIDDELD OF MOEILIJK
Kies je avontuur: de grote klassiekers om rustig te beginnen of de lastigste verwijzingen voor experts.

COMBO'S EN FEVER-MODUS
Antwoord snel voor meer punten. 5 goede antwoorden op rij starten de Fever-modus: al je punten tellen dubbel!

ELKE DAG EEN NIEUWE UITDAGING
10 mysterieuze levels, voor iedereen gelijk. Houd je reeks vast en open elke 7 dagen een kist.

NOOIT VAST
Toon een emoji, haal er 5 foute weg of schud het raster. En als je het mist, verlies je een leven en probeer je hetzelfde level opnieuw tot je het hebt.

MEERDERE MODI
• Klassiek: het avontuur, etappe na etappe
• Zen: geen klok, geen levens, gewoon voor de lol
• Tegen de klok: zoveel mogelijk levels in 60 seconden
• Hardcore: één leven, dubbele munten
• Categorie: speel alleen wat je leuk vindt

DAAG JE VRIENDEN UIT
Stuur je laatste 5 levels en je score: je vrienden moeten je verslaan.

3 STERREN EN DE POP-CORNÉDEX
Elk gevonden antwoord komt in je album, per categorie. Speel levels opnieuw voor alle 3 sterren: zonder hulp, zonder fout en snel!

DE AVONTURENKAART
Loop level na level over een pad, door 21 werelden met een eigen landschap, samen met Popi, de popcornmascotte die op elk antwoord reageert. Je voortgang blijft bewaard.

EN NOG MEER
Elke dag een cadeau, het rad van fortuin, reeksbeschermers, een herinnering aan de uitdaging, schilden en levelpassen, thema's en stijlen om te ontgrendelen, een boom met 46 trofeeën, je statistieken, donkere modus en een lay-out voor iPad.

Speelbaar offline, zonder account, in 13 talen.

**Keywords (100)**
raden,film,raadsel,woord,serie,logo,land,popcorn,hersenen,kennis,puzzel,merk,bioscoop,anime,trivia

**What's New (4000)**
De eerste versie van Pop-Corn Alchemy! 400 levels, 16 categorieën, 3 moeilijkheden, een kaart met 21 werelden, een Zen-modus, een dagelijkse uitdaging en het rad van fortuin. Veel plezier

---

## 🇵🇱 Polski (`pl`)

**Subtitle (30)**
Quiz: zgadnij wszystko z emoji

**Promotional text (170)**
400 poziomów, 16 kategorii i 3 poziomy trudności: połącz właściwe emoji, by odgadnąć filmy, seriale, kraje i marki. Nowe wyzwanie każdego dnia!

**Description (4000)**
Lew + korona? Król Lew!

Pop-Corn Alchemy to gra w zgadywanie z emoji, od której mózg strzela jak popcorn. Każdy poziom daje ci nazwę – film, serial, kraj, danie, markę… – i siatkę 20 emoji. Znajdź te właściwe i połącz je!

400 POZIOMÓW, 16 KATEGORII
Filmy, seriale, gry wideo, muzyka, kraje, zabytki, sport, zawody, baśnie, dom, święta, jedzenie, marki, przyroda, anime i YouTuberzy.

ŁATWY, ŚREDNI LUB TRUDNY
Wybierz przygodę: wielkie klasyki na spokojny start albo najtrudniejsze hasła dla ekspertów.

COMBO I TRYB FEVER
Odpowiadaj szybko, by zdobyć więcej punktów. 5 dobrych odpowiedzi z rzędu włącza tryb Fever: wszystkie punkty razy dwa!

NOWE WYZWANIE KAŻDEGO DNIA
10 tajemniczych poziomów, takich samych dla wszystkich. Utrzymaj serię i otwieraj skrzynię co 7 dni.

NIGDY NIE UTKNIESZ
Odkryj emoji, usuń 5 złych albo przetasuj siatkę. A gdy się pomylisz, tracisz życie i próbujesz ten sam poziom, aż zgadniesz.

WIELE TRYBÓW
• Klasyczny: przygoda, etap po etapie
• Zen: bez zegara, bez żyć, dla przyjemności
• Na czas: jak najwięcej poziomów w 60 sekund
• Hardcore: jedno życie, podwójne monety
• Kategoria: graj tylko w to, co lubisz

WYZWIJ ZNAJOMYCH
Wyślij ostatnie 5 poziomów i swój wynik: znajomi muszą go pobić.

3 GWIAZDKI I POP-CORNÉDEX
Każda znaleziona odpowiedź trafia do albumu, według kategorii. Zagraj ponownie po 3 gwiazdki: bez pomocy, bez błędów i szybko!

MAPA PRZYGODY
Idź poziom po poziomie ścieżką przez 21 światów z własnym krajobrazem, razem z Popim, popcornową maskotką, która reaguje na każdą odpowiedź. Twój postęp jest zapisany.

I WIĘCEJ
Prezent każdego dnia, koło fortuny, ochrona serii, przypomnienie o wyzwaniu, tarcze i przepustki, motywy i style do odblokowania, drzewko 46 trofeów, statystyki, tryb ciemny i układ dla iPada.

Działa offline, bez konta, w 13 językach.

**Keywords (100)**
zgadywanie,film,zagadka,słowa,serial,logo,kraj,popcorn,łamigłówka,wiedza,marka,kino,anime,rebus

**What's New (4000)**
Pierwsza wersja Pop-Corn Alchemy! 400 poziomów, 16 kategorii, 3 poziomy trudności, mapa z 21 światami, tryb Zen, wyzwanie dnia i koło fortuny. Miłej zabawy

---

## 🇹🇷 Türkçe (`tr`)

**Subtitle (30)**
Emoji quiz: her şeyi tahmin et

**Promotional text (170)**
400 seviye, 16 kategori ve 3 zorluk: doğru emojileri birleştirip filmleri, dizileri, ülkeleri ve markaları bul. Her gün yeni bir meydan okuma!

**Description (4000)**
Bir aslan + bir taç? Aslan Kral!

Pop-Corn Alchemy, beynini patlamış mısır gibi patlatan emoji tahmin oyunu. Her seviye sana bir isim verir – bir film, bir dizi, bir ülke, bir yemek, bir marka… – ve 20 emojilik bir ızgara. Doğru olanları bul ve birleştir!

400 SEVİYE, 16 KATEGORİ
Filmler, diziler, video oyunları, müzik, ülkeler, anıtlar, spor, meslekler, masallar, ev, kutlamalar, yemek, markalar, doğa, anime ve YouTuber'lar.

KOLAY, ORTA YA DA ZOR
Maceranı seç: rahat bir başlangıç için büyük klasikler ya da uzmanlar için en zorlu göndermeler.

KOMBOLAR VE FEVER MODU
Daha çok puan için hızlı cevap ver. Üst üste 5 doğru cevap Fever modunu açar: tüm puanlar iki katı!

HER GÜN YENİ BİR MEYDAN OKUMA
Herkes için aynı 10 gizemli seviye. Serini koru ve her 7 günde bir sandık aç.

ASLA TAKILMA
Bir emoji göster, 5 yanlışı kaldır ya da ızgarayı karıştır. Iskalarsan bir can kaybedersin ve bulana kadar aynı seviyeyi yeniden denersin.

BİRÇOK MOD
• Klasik: macera, etap etap
• Zen: saat yok, can yok, sadece eğlence
• Zamana karşı: 60 saniyede olabildiğince çok seviye
• Hardcore: tek can, iki kat altın
• Kategori: sadece sevdiğini oyna

ARKADAŞLARINA MEYDAN OKU
Son 5 seviyeni ve puanını gönder: arkadaşların onu geçmeli.

3 YILDIZ VE POP-CORNÉDEX
Bulduğun her cevap kategoriye göre albümüne eklenir. 3 yıldız için seviyeleri tekrar oyna: ipucusuz, hatasız ve hızlı!

MACERA HARİTASI
Her cevaba tepki veren patlamış mısır maskotu Popi ile, kendine özgü manzaraları olan 21 dünyada bir yol boyunca seviye seviye ilerle. İlerlemen kaydedilir.

VE DAHA FAZLASI
Her gün bir hediye, şans çarkı, seri koruyucular, meydan okuma hatırlatıcısı, kalkanlar ve seviye geçişleri, açılacak temalar ve stiller, 46 kupalık bir ağaç, istatistiklerin, karanlık mod ve iPad'e özel bir düzen.

İnternetsiz oynanır, hesap gerekmez, 13 dilde.

**Keywords (100)**
bilgi yarışması,film,bulmaca,kelime,dizi,logo,ülke,zeka,oyun,kültür,marka,sinema,anime,bilmece

**What's New (4000)**
Pop-Corn Alchemy'nin ilk sürümü! 400 seviye, 16 kategori, 3 zorluk, 21 dünyalı bir harita, Zen modu, günün meydan okuması ve şans çarkı. İyi eğlenceler

---

## 🇷🇺 Русский (`ru`)

**Subtitle (30)**
Эмодзи-квиз: угадай всё!

**Promotional text (170)**
400 уровней, 16 категорий и 3 уровня сложности: соединяй нужные эмодзи и угадывай фильмы, сериалы, страны и бренды. Новое задание каждый день!

**Description (4000)**
Лев + корона? Король Лев!

Pop-Corn Alchemy — игра-угадайка с эмодзи, от которой мозг взрывается, как попкорн. На каждом уровне — название (фильм, сериал, страна, блюдо, бренд…) и сетка из 20 эмодзи. Найди нужные и соедини их!

400 УРОВНЕЙ, 16 КАТЕГОРИЙ
Фильмы, сериалы, видеоигры, музыка, страны, памятники, спорт, профессии, сказки, дом, праздники, еда, бренды, природа, аниме и ютуберы.

ЛЕГКО, СРЕДНЕ ИЛИ СЛОЖНО
Выбери приключение: великая классика для спокойного старта или самые хитрые загадки для знатоков.

КОМБО И РЕЖИМ FEVER
Отвечай быстро, чтобы набрать больше очков. 5 верных ответов подряд включают режим Fever: все очки удваиваются!

НОВОЕ ЗАДАНИЕ КАЖДЫЙ ДЕНЬ
10 загадочных уровней, одинаковых для всех. Держи серию и открывай сундук каждые 7 дней.

НИКОГДА НЕ ЗАСТРЯНЕШЬ
Открой эмодзи, убери 5 неверных или перемешай сетку. А если ошибёшься, потеряешь жизнь и попробуешь тот же уровень ещё раз, пока не угадаешь.

НЕСКОЛЬКО РЕЖИМОВ
• Классика: приключение, этап за этапом
• Дзен: без таймера и жизней, просто для удовольствия
• На время: как можно больше уровней за 60 секунд
• Хардкор: одна жизнь, двойные монеты
• Категория: играй только в то, что любишь

БРОСЬ ВЫЗОВ ДРУЗЬЯМ
Отправь свои последние 5 уровней и счёт: друзья должны его побить.

3 ЗВЕЗДЫ И POP-CORNÉDEX
Каждый найденный ответ попадает в альбом, по категориям. Переигрывай уровни ради 3 звёзд: без подсказок, без ошибок и быстро!

КАРТА ПРИКЛЮЧЕНИЯ
Иди уровень за уровнем по тропе через 21 мир со своими пейзажами вместе с Попи — талисманом-попкорном, который реагирует на каждый ответ. Прогресс сохраняется.

И ЕЩЁ
Подарок каждый день, колесо удачи, защита серии, напоминание о задании, щиты и пропуски, темы и стили, дерево из 46 трофеев, статистика, тёмная тема и интерфейс для iPad.

Работает без интернета, без регистрации, на 13 языках.

**Keywords (100)**
викторина,фильм,загадка,слова,сериал,логотип,страна,попкорн,головоломка,бренд,кино,аниме

**What's New (4000)**
Первая версия Pop-Corn Alchemy! 400 уровней, 16 категорий, 3 уровня сложности, карта с 21 миром, режим Дзен, задание дня и колесо удачи. Приятной игры

---

## 🇯🇵 日本語 (`ja`)

**Subtitle (30)**
絵文字クイズ：なんでも当てよう

**Promotional text (170)**
400レベル、16カテゴリー、3つの難易度。正しい絵文字を組み合わせて、映画、ドラマ、国、ブランドを当てよう。毎日新しいチャレンジも！

**Description (4000)**
ライオン＋王冠？ライオン・キング！

Pop-Corn Alchemyは、頭がポップコーンみたいにはじける絵文字当てゲーム。各レベルには名前（映画、ドラマ、国、料理、ブランド…）と20個の絵文字が並んだ盤面。正しい絵文字を見つけて合体させよう！

400レベル、16カテゴリー
映画、ドラマ、ゲーム、音楽、国、名所、スポーツ、職業、おとぎ話、家、イベント、食べ物、ブランド、自然、アニメ、YouTuber。

かんたん、ふつう、むずかしい
定番の名作でゆっくり始めるか、上級者向けの難問に挑むか。冒険を選ぼう。

コンボとフィーバーモード
速く答えるほど高得点。5問連続正解でフィーバーモード発動、ポイントがすべて2倍に！

毎日新しいチャレンジ
全員共通のミステリー10レベル。連続記録をキープして、7日ごとに宝箱を開けよう。

行き詰まらない
絵文字を1つ表示、間違いを5つ消す、並びをシャッフル。はずれるとライフが1つ減り、正解するまで同じレベルに再挑戦できます。

いろいろなモード
• クラシック: ステージごとに進む冒険
• ZEN: 時間もライフもなし
• タイムアタック: 60秒でできるだけ多く
• ハードコア: ライフ1つ、コイン2倍
• カテゴリー: 好きなものだけプレイ

友だちに挑戦
最近の5レベルとスコアを送ろう。友だちはそれを超えられるかな？

星3つとPop-Cornédex
見つけた答えはカテゴリー別にアルバムへ。ヒントなし・ミスなし・スピードで星3つを目指そう！

冒険マップ
それぞれの景色をもつ21のワールドを、答えるたびに反応するポップコーンのマスコット「ポピ」と一緒に1レベルずつ進もう。進行状況は保存されます。

ほかにも
毎日のギフト、ラッキールーレット、連続記録キーパー、チャレンジのリマインダー、シールドとレベルパス、テーマとスタイル、46個のトロフィーツリー、統計、ダークモード、iPad対応レイアウト。

オフラインで遊べて、アカウント不要、13言語対応。

**Keywords (100)**
当てる,映画,なぞなぞ,言葉,ドラマ,ロゴ,国,ポップコーン,脳トレ,雑学,謎解き,アニメ,ブランド,連想

**What's New (4000)**
Pop-Corn Alchemy最初のバージョン！400レベル、16カテゴリー、3つの難易度、21ワールドの冒険マップ、ZENモード、デイリーチャレンジ、ラッキールーレット。楽しんでね

---

## 🇰🇷 한국어 (`ko`)

**Subtitle (30)**
이모지 퀴즈: 뭐든지 맞혀 봐

**Promotional text (170)**
400레벨, 16개 카테고리, 3가지 난이도! 알맞은 이모지를 합쳐 영화, 드라마, 나라, 브랜드를 맞혀 보세요. 매일 새로운 도전도 있어요!

**Description (4000)**
사자 + 왕관? 라이온 킹!

Pop-Corn Alchemy는 머리가 팝콘처럼 톡톡 터지는 이모지 맞히기 게임이에요. 레벨마다 이름(영화, 드라마, 나라, 음식, 브랜드…)과 이모지 20개가 놓인 판이 나와요. 알맞은 이모지를 찾아 합쳐 보세요!

400레벨, 16개 카테고리
영화, 드라마, 비디오 게임, 음악, 나라, 명소, 스포츠, 직업, 동화, 집, 기념일, 음식, 브랜드, 자연, 애니메이션, 유튜버.

쉬움, 보통, 어려움
누구나 아는 명작으로 편하게 시작하거나, 고수를 위한 어려운 문제에 도전하세요.

콤보와 피버 모드
빠르게 답할수록 점수가 올라가요. 5번 연속 정답이면 피버 모드: 모든 점수가 두 배!

매일 새로운 도전
모두에게 똑같은 미스터리 10레벨. 연속 기록을 이어가고 7일마다 상자를 열어요.

막힐 일 없어요
이모지 하나 공개, 틀린 이모지 5개 제거, 칸 섞기. 틀리면 목숨이 하나 줄고, 맞힐 때까지 같은 레벨에 다시 도전해요.

다양한 모드
• 클래식: 스테이지별 모험
• 젠: 시간도 목숨도 없이 편하게
• 타임 어택: 60초 동안 최대한 많이
• 하드코어: 목숨 하나, 코인 두 배
• 카테고리: 좋아하는 것만 플레이

친구에게 도전
최근 5레벨과 점수를 보내세요. 친구가 넘을 수 있을까요?

별 3개와 Pop-Cornédex
찾은 정답은 카테고리별로 앨범에 모여요. 힌트 없이, 실수 없이, 빠르게 별 3개에 도전하세요!

모험 지도
정답마다 반응하는 팝콘 마스코트 포피와 함께, 저마다 다른 풍경의 21개 월드를 한 레벨씩 나아가요. 진행 상황은 저장돼요.

그 밖에도
매일 선물, 행운의 룰렛, 연속 기록 보호, 도전 알림, 방패와 레벨 패스, 테마와 스타일, 46개 트로피 트리, 통계, 다크 모드, iPad 맞춤 화면.

오프라인으로 즐기고, 계정이 필요 없으며, 13개 언어를 지원해요.

**Keywords (100)**
맞히기,영화,수수께끼,단어,드라마,로고,나라,팝콘,두뇌,상식,게임,애니,브랜드,넌센스

**What's New (4000)**
Pop-Corn Alchemy 첫 번째 버전! 400레벨, 16개 카테고리, 3가지 난이도, 21개 월드의 모험 지도, 젠 모드, 오늘의 도전, 행운의 룰렛. 즐겁게 플레이하세요

---

## 🇨🇳 简体中文 (`zh-Hans`)

**Subtitle (30)**
表情猜谜：什么都能猜

**Promotional text (170)**
400个关卡、16个类别、3种难度：组合正确的表情，猜出电影、剧集、国家和品牌。每天都有新挑战！

**Description (4000)**
一头狮子 + 一顶王冠？狮子王！

Pop-Corn Alchemy 是一款让大脑像爆米花一样蹦跳的表情猜谜游戏。每一关给你一个名字（电影、剧集、国家、美食、品牌……）和一个由20个表情组成的格子。找出正确的表情，把它们合成！

400个关卡，16个类别
电影、剧集、电子游戏、音乐、国家、名胜、运动、职业、童话、家居、节日、美食、品牌、自然、动漫和YouTube博主。

简单、中等或困难
选择你的冒险：用经典之作轻松入门，或挑战高手专属的难题。

连击与狂热模式
答得越快，得分越高。连续答对5题即可开启狂热模式：所有得分翻倍！

每天都有新挑战
10个神秘关卡，所有人都一样。保持连续纪录，每7天开一个宝箱。

永远不会卡住
显示一个表情、去掉5个错误表情或打乱格子。答错会失去一条命，然后重试同一关，直到答对为止。

多种模式
• 经典：一个阶段接一个阶段的冒险
• 禅：不计时，不限命，只为开心
• 限时：60秒内闯过尽可能多的关卡
• 硬核：只有一条命，金币翻倍
• 类别：只玩你喜欢的

挑战好友
发送你最近的5个关卡和得分，看好友能不能超过你。

3颗星与 Pop-Cornédex
找到的每个答案都会按类别收进你的图鉴。重玩关卡冲击3颗星：无提示、无失误、够快！

冒险地图
和会对每个答案做出反应的爆米花吉祥物 Popi 一起，沿着小路一关一关穿越21个风景各异的世界。进度会自动保存。

还有更多
每日礼物、幸运转盘、连续保护、挑战提醒、护盾和跳关卡、可解锁的主题和风格、46个奖杯的成就树、个人统计、深色模式，以及为 iPad 设计的界面。

可离线游玩，无需账号，支持13种语言。

**Keywords (100)**
竞猜,电影,谜语,文字,剧集,标志,国家,爆米花,益智,知识,游戏,动漫,品牌,脑筋急转弯

**What's New (4000)**
Pop-Corn Alchemy 首个版本！400个关卡、16个类别、3种难度、21个世界的冒险地图、禅模式、每日挑战和幸运转盘。祝你玩得开心

---

---

## Nouveautés de la version 1.1 (champ « Nouveautés », à coller pour chaque langue)

| Langue | Texte |
|---|---|
| Français | Nouveau : les coffres ! Gagne des coffres en bois, en or et légendaires en jouant, et ouvre-les en 3D. Pièces, indices, bonus et même des thèmes inédits t'attendent dedans. L'économie du jeu a aussi été revue : chaque pièce compte ! |
| English | New: chests! Win wooden, golden and legendary chests as you play, and open them in 3D. Coins, hints, bonuses and even new themes are waiting inside. The game's economy has been rebalanced too: every coin counts! |
| Español | ¡Novedad: los cofres! Gana cofres de madera, de oro y legendarios jugando, y ábrelos en 3D. Dentro te esperan monedas, pistas, bonus e incluso temas nuevos. También hemos reequilibrado la economía del juego: ¡cada moneda cuenta! |
| Deutsch | Neu: Truhen! Gewinne beim Spielen Holz-, Gold- und legendäre Truhen und öffne sie in 3D. Darin warten Münzen, Tipps, Boni und sogar neue Designs. Auch die Spielwirtschaft wurde überarbeitet: Jede Münze zählt! |
| Italiano | Novità: i forzieri! Vinci forzieri di legno, d'oro e leggendari giocando e aprili in 3D. Dentro ti aspettano monete, indizi, bonus e perfino nuovi temi. Abbiamo anche ribilanciato l'economia del gioco: ogni moneta conta! |
| Português (Brasil) | Novidade: os baús! Ganhe baús de madeira, de ouro e lendários jogando e abra-os em 3D. Moedas, dicas, bônus e até temas novos esperam por você. A economia do jogo também foi ajustada: cada moeda conta! |
| Nederlands | Nieuw: kisten! Win houten, gouden en legendarische kisten tijdens het spelen en open ze in 3D. Er wachten munten, hints, bonussen en zelfs nieuwe thema's op je. Ook de economie van het spel is herzien: elke munt telt! |
| Polski | Nowość: skrzynie! Zdobywaj drewniane, złote i legendarne skrzynie, grając, i otwieraj je w 3D. W środku czekają monety, podpowiedzi, bonusy, a nawet nowe motywy. Przebudowaliśmy też ekonomię gry: każda moneta się liczy! |
| Türkçe | Yeni: sandıklar! Oynarken ahşap, altın ve efsanevi sandıklar kazan ve onları 3D olarak aç. İçlerinde altınlar, ipuçları, bonuslar ve hatta yeni temalar seni bekliyor. Oyunun ekonomisi de yeniden dengelendi: her altın değerli! |
| Русский | Новое: сундуки! Выигрывай деревянные, золотые и легендарные сундуки в игре и открывай их в 3D. Внутри тебя ждут монеты, подсказки, бонусы и даже новые темы. Экономика игры тоже обновлена: каждая монета на счету! |
| 日本語 | 新登場：宝箱！プレイして木・金・伝説の宝箱を手に入れ、3Dで開けよう。中にはコイン、ヒント、ボーナス、さらに新しいテーマも。ゲーム内の経済も見直しました。1枚のコインが大切に！ |
| 한국어 | 새로운 기능: 상자! 플레이하며 나무, 황금, 전설의 상자를 얻고 3D로 열어 보세요. 코인, 힌트, 보너스는 물론 새 테마까지 들어 있어요. 게임 경제도 새롭게 조정했어요. 코인 하나하나가 소중해요! |
| 简体中文 | 新内容：宝箱！在游戏中赢取木宝箱、金宝箱和传说宝箱，并以3D方式打开。里面有金币、提示、奖励，甚至还有新主题。游戏经济也重新平衡了：每一枚金币都很珍贵！ |
