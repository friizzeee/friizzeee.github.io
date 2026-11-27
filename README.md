# nether — site de monteur vidéo

Astro 7, Tailwind 4 (remise à zéro), GSAP + Lenis. Direction artistique : **« Plan-séquence »**.
La page d'accueil est un seul plan : on se promène dans un studio la nuit, d'une alcôve à l'autre (une réalisation
par alcôve, l'écran à gauche et sa fiche à droite), jusqu'au bureau de montage au bout du couloir.

## Lancer le site

```sh
npm install        # une seule fois
npm run dev        # http://localhost:4321
npm run build      # version finale dans dist/
npm run preview    # tester la version finale
npx astro check    # vérification des types (0 erreur attendue)
```

## Où modifier quoi

| Quoi | Fichier |
|---|---|
| Lien Discord, pseudo, e-mail, SEO | `src/config/site.ts` |
| **Offres, prix, liens Apa, codes promo et dates** | `src/config/payment.ts` |
| Réalisations (projets, vidéos, catégories, travail fait) | `src/data/portfolio.ts` |
| Arrêts du plan-séquence (textes, boucles) | `src/data/take.ts` |
| Méthode (6 étapes + l'exemple Victoire Royale) | `src/data/method.ts` |
| À propos, fiche technique de l'accueil | `src/data/about.ts` |
| Formats / services, univers | `src/data/services.ts` |
| Déroulé d'une commande, modèle de message | `src/data/process.ts` |
| Film des coulisses, profil Discord | `src/data/coulisses.ts` |
| Couleurs, polices, tempos | `src/styles/global.css` (haut du fichier) |

## Ajouter une réalisation

1. Miniature dans `src/assets/portfolio/`, vidéo (et boucle muette d'aperçu, facultative) dans `public/videos/`.
2. Copiez le bloc « NOUVEAU PROJET » de `src/data/portfolio.ts` et remplissez-le (catégories, vidéos, travail).

Le projet apparaît tout seul dans **Réalisations** (avec son filtre de catégorie) et obtient sa page `/portfolio/<slug>`.
Format vertical : `format: '9:16'`. Pour préparer la vidéo web, inspirez-vous des fonctions de
`tools/videos/encode_all.sh` (voir « Les vidéos » plus bas).

## Le plan-séquence (la balade dans le studio)

- `src/components/home/Take.astro` (structure) et `src/scripts/modules/take.ts` (tout se déduit de la position du défilement).
- Le décor : un couloir de studio la nuit. À gauche, une alcôve par réalisation (un écran 16:9 pour les best-of, des
  écrans verticaux pour les shorts, et un pan de mur libre où se pose la fiche) ; au bout, le bureau des coulisses
  (`nether/coulisses/edit/scripts/desk_scene.py`). Meubles et textures : Poly Haven (CC0), rangés avec ceux des coulisses.
- Les images du trajet sont rendues dans Blender par `tools/plan-sequence/render_walk.py`. Pour chaque image,
  `public/plan/<format>/corners.json` donne les quatre coins de chaque écran entièrement visible : la vraie boucle
  vidéo y est calée en perspective (`src/scripts/lib/homography.ts`, test :
  `node --experimental-strip-types src/scripts/lib/homography.test.ts`), à la taille de l'écran dans l'image.
- Les écrans du décor affichent la première image de chaque boucle (`src/assets/take/`) : si une boucle change,
  refaites son image, puis le rendu.
- Refaire les images (paysage, puis téléphone), environ 10 minutes chacune (473 images : assez pour que la caméra
  glisse sans à-coups ; entre deux alcôves, le regard file en diagonale vers la suivante plutôt que de faire demi-tour ;
  le site fond en plus deux images voisines l'une dans l'autre) :

  ```sh
  blender -b -P tools/plan-sequence/render_walk.py -- --out ../_render/walk-16x9 --format 16x9
  blender -b -P tools/plan-sequence/render_walk.py -- --out ../_render/walk-9x16 --format 9x16
  python tools/plan-sequence/to_webp.py ../_render/walk-16x9 public/plan/16x9 --width 1920
  python tools/plan-sequence/to_webp.py ../_render/walk-9x16 public/plan/9x16 --width 1080
  ```

  Pour cadrer sans tout rendre : `--test hero,vr,gb-shorts,desk --scale 50` (une image par pose).
- Sans JavaScript, avec « réduire les animations » ou en économie de données : la même page, les arrêts les uns sous
  les autres (l'image à gauche, la fiche à droite), sans vidéo automatique.

## Les vidéos

Toutes les versions web sont faites par `tools/videos/encode_all.sh` (et `encode_golden_boy_loops.sh` pour les boucles
de Golden Boy), à partir des exports d'origine : 1080p, H.264, « faststart ». Deux limites d'hébergement :
**100 Mo par fichier** (GitHub) et **1 Go pour tout le site** (GitHub Pages). C'est pourquoi les best-of sont en
plusieurs parties, et chacun a une version légère (480p ou 720p) choisie d'office sur téléphone ou connexion lente.

## Paiement

Les boutons ouvrent les pages Apa de `src/config/payment.ts` (le site ne fait que rediriger). Une promo disparaît
d'elle-même après sa date `until`, même sans reconstruire le site. Le paiement en fin de mois n'est pas un abonnement.

## Revenir à l'ancien site

L'ancien site est sauvegardé tel quel dans `../backup-site-original/site/` (voir `LISEZMOI-RESTAURATION.md` à côté)
et reste la branche `main` de ce dépôt git. La refonte est sur la branche `refonte-plan-sequence`.
