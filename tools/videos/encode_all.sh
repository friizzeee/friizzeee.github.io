#!/usr/bin/env bash
# Versions web en 1080p de toutes les vidéos du site (26/11/2026).
# Sources : Desktop/montage (Marty, Victoire Royale, shorts de Marty) et nether/Golden boy.
# Contraintes : GitHub refuse les fichiers de plus de 100 Mo ; GitHub Pages refuse un site de plus de 1 Go.
# Lancer depuis n'importe où : bash tools/videos/encode_all.sh [étape…]   (sans argument : tout)
set -euo pipefail
D="C:/Users/Nadeg/Desktop"
OUT="$D/nether/site/public/videos"
TMP="$D/nether/_encodes"
mkdir -p "$TMP"
MARTY="$D/montage/MARTY_BEST_OF_3_LIVES/08_Export"
VR="$D/montage/MONTAGE_FINAL/Fortnite_Victoire_Royale_MONTAGE.mp4"
SHORTS="$D/montage/short_montage/video_bottom_55k/04_exports"
GB="$D/nether/Golden boy"
X="aq-mode=3:keyint=120:min-keyint=30"
log(){ echo "[$(date +%H:%M:%S)] $*"; }

# Fichier final : écrit d'abord à côté, remplacé seulement si l'encodage a réussi.
two_pass(){ # src ss t scale vbit abit out
  local src=$1 ss=$2 t=$3 sc=$4 vb=$5 ab=$6 out=$7 tmp="$TMP/$(basename "$7")"
  ffmpeg -v error -y -ss "$ss" -t "$t" -i "$src" -vf "fps=30,scale=$sc:flags=lanczos" -c:v libx264 -preset slower \
    -b:v "$vb" -pass 1 -passlogfile "$tmp.log" -x264-params "$X" -an -f null NUL
  ffmpeg -v error -y -ss "$ss" -t "$t" -i "$src" -vf "fps=30,scale=$sc:flags=lanczos" -c:v libx264 -preset slower \
    -b:v "$vb" -pass 2 -passlogfile "$tmp.log" -x264-params "$X" -profile:v high -pix_fmt yuv420p \
    -c:a aac -b:a "$ab" -ac 2 -movflags +faststart "$tmp"
  mv -f "$tmp" "$out"; rm -f "$tmp.log"*; log "ok $(basename "$out") $(stat -c %s "$out") octets"
}
crf(){ # src ss t vf crf maxrate audio(0/1) out [extra]
  local src=$1 ss=$2 t=$3 vf=$4 q=$5 mr=$6 au=$7 out=$8 tmp="$TMP/$(basename "$8")"
  local a=(-an); [ "$au" = 1 ] && a=(-c:a aac -b:a 160k -ac 2)
  local tt=(); [ "$t" != "-" ] && tt=(-t "$t")
  ffmpeg -v error -y -ss "$ss" "${tt[@]}" -i "$src" -vf "$vf" -c:v libx264 -preset slower -crf "$q" \
    -maxrate "$mr" -bufsize "$(( ${mr%M} * 2 ))M" -x264-params "$X" -profile:v high -pix_fmt yuv420p \
    "${a[@]}" -movflags +faststart "$tmp"
  mv -f "$tmp" "$out"; log "ok $(basename "$out") $(stat -c %s "$out") octets"
}

step_gb(){
  # Best-of en deux parties, coupé au début de l'échange « le mec qui tape les gays » (7:00,53, entre deux plans).
  # 2 passes, environ 93 Mo par partie (en qualité constante, la partie 1 dépassait 100 Mo).
  two_pass "$GB/GOLDENBOY_BEST_OF_OMETV_V3.mp4" 0 420.53 1920:1080 1590k 160k "$OUT/golden-boy-best-of-partie1.mp4"
  two_pass "$GB/GOLDENBOY_BEST_OF_OMETV_V3.mp4" 420.53 462.5 1920:1080 1430k 160k "$OUT/golden-boy-best-of-partie2.mp4"
  crf "$GB/GOLDENBOY_BEST_OF_OMETV_V3.mp4" 0 420.53 "scale=854:480:flags=lanczos" 25 1M 1 "$OUT/golden-boy-best-of-partie1-480p.mp4"
  crf "$GB/GOLDENBOY_BEST_OF_OMETV_V3.mp4" 420.53 - "scale=854:480:flags=lanczos" 25 1M 1 "$OUT/golden-boy-best-of-partie2-480p.mp4"
}
step_gb_shorts(){
  # Déjà en 1080 × 1920, H.264 + AAC, « faststart » : copiés tels quels (pas de perte).
  for pair in "SHORT_1_IL_ME_RECONNAIT_V4:reconnait" "SHORT_6_CHAT:chat" "SHORT_7_VOITURE:voiture"; do
    ffmpeg -v error -y -i "$GB/${pair%%:*}.mp4" -map 0:v:0 -map 0:a:0 -c copy -map_metadata -1 -movflags +faststart "$OUT/golden-boy-short-${pair##*:}.mp4"
    log "ok golden-boy-short-${pair##*:}.mp4"
  done
}
step_marty(){
  # Trois parties en 1080p30, 2 passes, environ 95 Mo chacune (limite GitHub : 100 Mo).
  two_pass "$MARTY/MARTY_BEST_OF_V5_partie1.mp4" 0 386.567 1920:1080 1770k 160k "$OUT/marty-best-of-v5-partie1.mp4"
  two_pass "$MARTY/MARTY_BEST_OF_V5_partie2.mp4" 0 310.483 1920:1080 2250k 160k "$OUT/marty-best-of-v5-partie2.mp4"
  two_pass "$MARTY/MARTY_BEST_OF_V5_partie3.mp4" 0 402.183 1920:1080 1700k 160k "$OUT/marty-best-of-v5-partie3.mp4"
}
step_marty_shorts(){
  ffmpeg -v error -y -i "$SHORTS/EXTRAIT_1_NVIDIA_BITCOIN.mp4" -c copy -map_metadata -1 -movflags +faststart "$OUT/marty-short-nvidia.mp4"; log "ok marty-short-nvidia.mp4"
  ffmpeg -v error -y -i "$SHORTS/EXTRAIT_2_BOTTOM_OU_CRASH.mp4" -c copy -map_metadata -1 -movflags +faststart "$OUT/marty-short-55k.mp4"; log "ok marty-short-55k.mp4"
}
step_vr(){
  # Le final (4:59 → fin), en 1080p à 60 i/s comme la source, et une version légère en 720p30.
  crf "$VR" 299.0 41.5 "scale=1920:1080" 23 10M 1 "$OUT/victoire-royale-finale.mp4"
  crf "$VR" 299.0 41.5 "fps=30,scale=1280:720:flags=lanczos" 23 4M 1 "$OUT/victoire-royale-finale-720p.mp4"
}
step_loops(){
  # Boucles muettes du plan-séquence : mêmes passages qu'avant (retrouvés image par image), en 1080p.
  # Fortnite pèse lourd : un cran plus compressé (la boucle joue dès l'entrée, sur un écran qui n'occupe qu'un coin de l'image).
  crf "$VR" 0 8.5 "fps=30,scale=1920:1080:flags=lanczos" 24 6M 0 "$OUT/plan-victoire-royale.mp4"
  crf "$MARTY/MARTY_BEST_OF_V5_partie1.mp4" 17.0 13.8 "fps=30,scale=1920:1080:flags=lanczos" 21 5M 0 "$OUT/plan-marty.mp4"
  crf "$OUT/coulisses-filmcraft.mp4" 3.0 12.0 "scale=1920:1080" 20 5M 0 "$OUT/plan-coulisses.mp4"
  crf "$SHORTS/EXTRAIT_1_NVIDIA_BITCOIN.mp4" 7.0 9.0 "scale=720:1280:flags=lanczos" 21 3M 0 "$OUT/plan-short-nvidia.mp4"
  crf "$SHORTS/EXTRAIT_2_BOTTOM_OU_CRASH.mp4" 6.0 8.0 "scale=720:1280:flags=lanczos" 21 3M 0 "$OUT/plan-short-55k.mp4"
}

steps=("$@"); [ ${#steps[@]} -eq 0 ] && steps=(gb gb_shorts marty_shorts vr loops marty)
for s in "${steps[@]}"; do log "== $s"; "step_$s"; done
log "fini"
