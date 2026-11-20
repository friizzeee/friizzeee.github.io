# nether — site portfolio de monteur vidéo

Site construit avec Astro, Tailwind CSS, GSAP et Lenis : **Accueil**, **Portfolio** (une page par projet) et **Contact**.
Direction artistique : « la salle de montage, la nuit ». La page se lit comme une vidéo de 10 minutes,
avec un timecode, des chapitres et des pistes de timeline.

## Démarrer

```sh
npm install        # une seule fois
npm run dev        # site en local sur http://localhost:4321
npm run build      # version finale dans le dossier dist/
npm run preview    # tester la version finale en local
```

---

## À personnaliser en premier

| Quoi | Fichier |
|---|---|
| **Lien Discord** (obligatoire) et pseudo | `src/config/site.ts` → `discord.url` et `discord.handle` |
| Nom de marque, titre du hero, sous-titre, SEO | `src/config/site.ts` |
| Adresse du site une fois en ligne | `astro.config.mjs` → `site`, et `public/robots.txt` |
| Textes des services | `src/data/services.ts` |
| Vidéos du portfolio | `src/data/portfolio.ts` |
| Texte « À propos », centres d'intérêt, photo | `src/data/about.ts` |
| Étapes du processus et d'une commande, modèle de brief | `src/data/process.ts` |
| **Offres et liens de paiement Apa** (prix, code promo) | `src/config/payment.ts` |
| Couleurs et polices | `src/styles/global.css` (bloc `@theme`) et `astro.config.mjs` (`fonts`) |

> ⚠️ **Lien Discord** : tant que `[DISCORD_LINK]` n'est pas remplacé, un bandeau jaune s'affiche sous
> les boutons en développement et un avertissement apparaît au build. Collez par exemple
> `https://discord.com/users/VOTRE_ID` ou une invitation `https://discord.gg/xxxx`.

> Le texte « À propos » mentionne « nether » en toutes lettres : si vous changez de nom, pensez à
> le modifier aussi dans `src/data/about.ts`.

---

## Ajouter une vidéo au portfolio

1. **Miniature** : placez l'image (JPG ou PNG, idéalement 1920×1080 ou 1080×1920) dans
   `src/assets/portfolio/`. Elle est convertie et allégée automatiquement.
2. **Boucle de prévisualisation (facultatif)** : une courte boucle muette jouée au survol, à placer dans
   `public/videos/`. Commande prête à copier (10 s à partir de 1:05, sans le son, ≈ 1 à 2 Mo) :

   ```sh
   ffmpeg -ss 00:01:05 -t 10 -i ma-video.mp4 -vf "fps=30,scale=854:-2" -an -c:v libx264 -crf 30 -preset slow -movflags +faststart public/videos/ma-video-preview.mp4
   ```

   Pour un format vertical, remplacez `scale=854:-2` par `scale=-2:854`.
3. **Fiche** : dans `src/data/portfolio.ts`, importez la miniature en haut du fichier, puis copiez le
   modèle « NOUVEAU PROJET » dans le tableau `projects` :

   ```ts
   import maMiniature from '../assets/portfolio/ma-miniature.jpg';
   // …
   {
     id: 'ma-video',
     title: 'Titre de la vidéo',
     subtitle: 'Nom de la chaîne',
     category: 'long',          // 'long' | 'short' | 'extract' | 'beforeAfter'
     format: '16:9',            // '9:16' pour TikTok / Reels
     duration: '12:30',
     niche: 'Finance',
     platform: 'YouTube',
     poster: maMiniature,
     preview: '/videos/ma-video-preview.mp4',
     media: { kind: 'youtube', id: 'dQw4w9WgXcQ' }, // l'ID après « v= » dans l'URL YouTube
   },
   ```

   - Vidéo hébergée sur le site plutôt que sur YouTube : `media: { kind: 'file', src: '/videos/ma-video.mp4' }`.
   - **Avant / Après** : `category: 'beforeAfter'` et
     `beforeAfter: { before: imageAvant, after: imageApres }` affichent un comparateur à curseur.
   - Les YouTube s'ouvrent via `youtube-nocookie.com`, et uniquement au clic : aucun traceur au chargement.

4. Les **emplacements « Prochains montages »** (`upcomingSlots`) s'affichent tant que la galerie est presque
   vide. Supprimez une ligne dès qu'un vrai projet du même type est en ligne.
   Les **filtres** apparaissent tout seuls à partir de 3 projets dans la galerie.

Le projet vedette (`featured: true`) est présenté comme une étude de cas : chiffres, chapitres, images
clés. Aujourd'hui, c'est **Victoire Royale couronnée**. Ses vidéos (`victoire-royale-preview.mp4` et
`victoire-royale-finale.mp4`) ont été extraites de `MONTAGE_FINAL/Fortnite_Victoire_Royale_MONTAGE.mp4`.
Les musiques de Kevin MacLeod sont sous licence CC BY 4.0 : le crédit s'affiche dans le lecteur, ne le retirez pas.

---

## Série client : les Best Of de Marty

Le bloc « Marty, en Best Of. » s'affiche en tête du portfolio. Ses vidéos sont dans
`src/data/portfolio.ts` → `clientSeries.videos` (aujourd'hui : les trois parties du Best Of V5).
Avec trois vidéos, la grille passe en trois colonnes ; avec deux, elle reste en deux colonnes en quinconce.
Deux possibilités par vidéo :

**A. Fichier hébergé sur le site** (cas actuel : les vidéos ne sont pas publiques sur YouTube)

```ts
{
  file: '/videos/ma-video.mp4',              // version web 720p
  fileLight: '/videos/ma-video-480p.mp4',    // facultatif : version 480p (téléphone, connexion lente)
  preview: '/videos/ma-video-preview.mp4',   // facultatif : boucle muette de 10 s jouée au survol
  poster: maMiniature,                       // une vraie image de la vidéo
  url: '',
  title: 'Titre',
  duration: '6:27',
  description: '…',
  chapters: [{ time: '0:28', seconds: 28, label: 'Le hack de Binance' }], // facultatif
  credits: 'Musiques : … (licence CC BY 4.0).',                           // facultatif, affiché sous le lecteur
},
```

Un export de montage pèse plusieurs centaines de Mo : on en tire quatre fichiers pour le web. Remplacez
`MON_EXPORT.mp4`, `80` (début de la boucle, en secondes) et `84` (instant de la miniature) :

```sh
# 1. Version 720p, environ 9 Mo par minute
ffmpeg -i MON_EXPORT.mp4 -vf "fps=30,scale=1280:720" -c:v libx264 -preset slow -crf 26 -maxrate 1800k -bufsize 3600k -g 90 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart public/videos/ma-video.mp4
# 2. Version 480p allégée, environ 4,5 Mo par minute (au-delà de 5 min 30, passez -crf à 29 pour rester sous 25 Mo)
ffmpeg -i MON_EXPORT.mp4 -vf "fps=30,scale=854:480" -c:v libx264 -preset slow -crf 27 -maxrate 800k -bufsize 1600k -g 90 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart public/videos/ma-video-480p.mp4
# 3. Boucle d'aperçu : 10 secondes muettes, environ 0,5 Mo
ffmpeg -ss 80 -t 10 -i MON_EXPORT.mp4 -vf "fps=30,scale=854:480" -an -c:v libx264 -preset slow -crf 30 -g 30 -pix_fmt yuv420p -movflags +faststart public/videos/ma-video-preview.mp4
# 4. Miniature : une image de la vidéo
ffmpeg -ss 84 -i MON_EXPORT.mp4 -frames:v 1 -vf "scale=1600:-2" -q:v 3 src/assets/portfolio/ma-video.jpg
```

Ce que le site fait de ces fichiers :

- À l'ouverture de la page, seules les miniatures sont chargées. La boucle d'aperçu ne se télécharge qu'au survol
  de la carte (ou quand elle est à l'écran sur mobile), la vidéo seulement au clic.
- Le lecteur démarre en 480p sur téléphone, en économie de données ou sur réseau lent, en 720p ailleurs.
  Le bouton 720p / 480p permet de changer en gardant la position.
- Chaque chapitre est cliquable sur la carte et marqué sur la barre de lecture. Les parties s'enchaînent
  depuis le lecteur (bandeau sous l'image, bouton « partie suivante » à la fin).
- Clavier, lecteur ouvert : Espace ou K (lecture), ← → (5 secondes), ↑ ↓ (volume), M (son), F (plein écran),
  Échap (fermer).

> ⚠️ Vérifiez la taille maximale par fichier de votre hébergeur avant la mise en ligne. Cloudflare Pages refuse
> les fichiers de plus de 25 Mo : les 720p actuels (47 à 57 Mo) n'y passent pas, les 480p (moins de 24 Mo) oui.
> Chez cet hébergeur, mettez le 480p dans `file` et retirez `fileLight`. Netlify accepte les deux.

**B. Vidéo YouTube publique** : `url: 'https://www.youtube.com/watch?v=XXXXXXXXXXX'` (sans `file`). La miniature et le
titre YouTube sont récupérés au build, la lecture se fait via `youtube-nocookie.com`, chargé au clic.

Une vidéo sans fichier ni lien n'apparaît pas sur le site en ligne ; en `npm run dev`, un emplacement jaune la signale.
Les chiffres affichés sous l'introduction sont dans `clientSeries.facts`. Les musiques des Best Of sont sous
licence CC BY 4.0 : le crédit (`credits`) s'affiche sous le lecteur, ne le retirez pas.

## Séquence « Behind the Edit » (accueil, après le portfolio)

La vidéo des coulisses FilmCraft, puis la carte du profil Discord. Tout se règle dans `src/data/coulisses.ts` :
chapitres (`start` en secondes, couleur `led`, texte de la légende), moments forts (`markers`), crédit musique
(obligatoire, CC BY 4.0) et contenu de la carte (avatar, nom affiché, tag, bio). Le lien et le pseudo viennent de
`src/config/site.ts`. Vidéos : `public/videos/coulisses-filmcraft.mp4` (1080p, 22 Mo) et `-720p.mp4` (téléphone),
tirées de `nether/coulisses/claude-montage-filmcraft-HORIZONTAL-V2.mp4`. Si l'avatar ou la bio changent sur
Discord, remplacez `src/assets/coulisses/discord-avatar.png` et le tableau `bio`.

## Moniteur de la page d'accueil

Le moniteur du hero montre le projet vedette (`featured: true`) : sa miniature, puis une boucle muette
`public/videos/<nom>-hero.mp4` (même nom que la boucle `-preview.mp4`). Pour la refaire :

```sh
ffmpeg -i public/videos/ma-video-preview.mp4 -vf "scale=640:-2" -an -c:v libx264 -crf 31 -preset slow -movflags +faststart public/videos/ma-video-hero.mp4
```

Les deux étiquettes flottantes reprennent les chiffres de l'étude de cas (`compression` et la valeur en LUFS).

---

## Offres et paiement (Apa)

La section **« Choose Your Editing Package »** (accueil, ancre `#offres`, et page Contact, ancre `#paiement`)
affiche les offres de `src/config/payment.ts`, rangées en **deux façons de régler** (une ligne chacune) :
**paiement en une fois** et **paiement en fin de mois**, chacune avec une **vidéo courte** et une **vidéo longue**,
soit quatre offres et quatre liens Apa. Le paiement en fin de mois n'est **pas un abonnement** : les prestations
du mois sont réglées en une seule fois, à la fin du mois. Le site ne fait que rediriger, n'enregistre aucune donnée de paiement et ne connecte
aucun wallet.

- **Changer un prix ou un lien** : modifiez l'offre dans `packages` (repérée par `billing` : `une-fois` ou `fin-de-mois`,
  et `format` : `short` ou `long`). Le montant (`amount`, en USD) doit toujours être celui de la page Apa.
- **Textes** : la description de chaque format est dans `formats`, l'explication de chaque mode (texte, « pour
  qui », libellé du bouton) dans `billings`. Les questions de la FAQ sont dans `Packages.astro`.
- Au build, un avertissement apparaît si deux offres partagent le même lien, ou s'il manque une combinaison
  mode + format.
- **Code promo** : le champ `promo` de l'offre (`code`, `percent`, `label` facultatif). `until: 'AAAA-MM-JJ'` fixe le
  dernier jour de validité : passé ce jour, la promo disparaît du site (même sans nouveau build). `highlight: true`
  met la carte en avant (halo, bouton plein). Passez `active: false` pour retirer le badge, le code et la mise en avant. Le site n'affiche jamais de prix réduit : la réduction est appliquée par
  Apa quand le client saisit le code (le lien doit accepter les codes promo dans votre tableau de bord Apa).
- Un lien qui ne commence pas par `https://apa.app/pay/` est refusé : le bouton est masqué et un avertissement
  apparaît au build.

---

## Mettre le site en ligne (gratuit)

Le site est 100 % statique (dossier `dist/`). Trois options simples :

- **Netlify** : glissez-déposez le dossier `dist/` sur https://app.netlify.com/drop
- **Vercel** ou **Cloudflare Pages** : importez le projet (commande `npm run build`, dossier `dist`).

Pensez ensuite à mettre la vraie adresse dans `astro.config.mjs` (`site`) et `public/robots.txt`.

---

## Organisation du code

```
src/
├─ config/        site.ts (nom, Discord, SEO) · payment.ts
├─ data/          services · portfolio · about · process · navigation
├─ assets/        miniatures (optimisées automatiquement)
├─ styles/        global.css : couleurs, typographie, boutons, cartes
├─ layouts/       BaseLayout.astro : <head>, SEO, en-tête, pied de page
├─ components/
│  ├─ layout/     Header (+ menu mobile), Footer, Scrubber (chapitres), Intro, Cut (transition)
│  ├─ home/       Hero, Universes, Services, Portfolio, About, Process, Packages, FinalCta
│  ├─ portfolio/  ClientSeries, FeaturedCase, WorkCard, BeforeAfter, PlayerDialog
│  ├─ contact/    DiscordCard, OrderSteps
│  └─ ui/         Button, DiscordButton, DiscordCta (grande tuile de la page Contact), Icon, Logo, TrackLabel
├─ scripts/
│  ├─ main.ts     point d'entrée : monte / démonte les animations à chaque page
│  ├─ lib/        dom (utilitaires), smooth (Lenis)
│  └─ modules/    chrome, effects, hero, portfolio, player (lecteur vidéo), intro, cut, copy
└─ pages/         index · contact · 404
```

### Animations par attributs

Ajoutez un attribut à n'importe quel élément pour l'animer :

| Attribut | Effet |
|---|---|
| `data-reveal="lines"` | titre qui monte ligne par ligne ; l'italique fait sa mise au point |
| `data-reveal="fade"` / `"stagger"` / `"clip"` | fondu, enfants en cascade, ouverture d'image |
| `data-reveal="cards"` | cartes qui arrivent en profondeur (le parent doit avoir `perspective`) |
| `data-reveal="wipe"` | enfants dévoilés de gauche à droite, comme des clips posés sur la piste |
| `data-reveal="scrub"` | texte qui s'allume mot à mot au rythme du défilement |
| `data-reveal="chars"` / `"bars"` / `"track"` | lettres une à une, barres SVG qui se lèvent, étiquette de piste |
| `data-reveal-delay="0.2"` / `data-reveal-start="top 80%"` | retard et point de déclenchement |
| `data-count="600"` | nombre qui défile jusqu'à sa valeur (`data-count-format="mmss"` pour 10:00) |
| `data-draw` | tracé SVG qui se dessine (le chemin doit avoir `pathLength="1"`) |
| `data-zoom="1.12"` | image qui recule doucement pendant le défilement |
| `data-follow-area` + `data-follow` | bouton de lecture qui suit la souris au-dessus d'une vidéo |
| `data-parallax="8"` | parallaxe légère (en %) |
| `data-magnetic` | élément attiré par la souris |
| `data-tilt="4"` | inclinaison 3D au survol (en degrés) |
| `data-chapter="Nom"` | la section devient un chapitre de la barre de lecture |

Si le visiteur a activé « réduire les animations » dans son système, il n'y a ni défilement fluide, ni
parallaxe, ni intro, ni vidéo automatique, et les textes s'affichent directement.

### Vérifications

```sh
npx astro check    # types TypeScript (0 erreur attendue)
npm run build      # build de production
```
