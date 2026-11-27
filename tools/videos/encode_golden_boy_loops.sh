#!/usr/bin/env bash
# Boucles muettes et aperçus de Golden Boy (26/11/2026). Même réglages que encode_all.sh.
set -euo pipefail
OUT="C:/Users/Nadeg/Desktop/nether/site/public/videos"
GB="C:/Users/Nadeg/Desktop/nether/Golden boy"
X="aq-mode=3:keyint=60:min-keyint=15"
loop(){ # src ss t scale crf out
  ffmpeg -v error -y -ss "$2" -t "$3" -i "$1" -vf "scale=$4:flags=lanczos" -c:v libx264 -preset slower -crf "$5" \
    -x264-params "$X" -profile:v high -pix_fmt yuv420p -an -movflags +faststart "$6"
  echo "ok $(basename "$6") $(stat -c %s "$6")"
}
B="$GB/GOLDENBOY_BEST_OF_OMETV_V3.mp4"
# Plan-séquence : le zoom et le sous-titre « J'aurais dit 19 » (4:10 → 4:20,5).
loop "$B" 250.0 10.5 1920:1080 21 "$OUT/plan-golden-boy.mp4"
# Aperçus des cartes (comme ceux de Marty) : un par partie.
loop "$B" 250.0 10 854:480 25 "$OUT/golden-boy-best-of-partie1-preview.mp4"
loop "$B" 535.0 10 854:480 25 "$OUT/golden-boy-best-of-partie2-preview.mp4"
# Shorts : la question piège, la carte du chat, « je remplis 4 fois ton frigo ».
loop "$GB/SHORT_1_IL_ME_RECONNAIT_V4.mp4" 4.5 8 720:1280 21 "$OUT/plan-gb-short-reconnait.mp4"
loop "$GB/SHORT_6_CHAT.mp4" 24.0 8 720:1280 21 "$OUT/plan-gb-short-chat.mp4"
loop "$GB/SHORT_7_VOITURE.mp4" 31.0 8 720:1280 21 "$OUT/plan-gb-short-voiture.mp4"
echo fini
