/**
 * generate-icons.js — Oracle Plus
 *
 * Convertit assets/images/icon.svg en tous les PNG requis par Expo.
 *
 * Usage :
 *   node generate-icons.js
 *
 * Prérequis (une seule fois) :
 *   npm install sharp --save-dev
 */

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const SRC = path.join(__dirname, 'assets/images/icon.svg');
const OUT = path.join(__dirname, 'assets/images');

// ─── Formats requis par Expo ───────────────────────────────────────────────
const targets = [
  // Icône principale (iOS + Android legacy + favicon)
  { file: 'icon.png',                    size: 1024, bg: null       },
  { file: 'favicon.png',                 size: 48,   bg: null       },
  { file: 'splash-icon.png',             size: 512,  bg: '#1A1A3E'  },

  // Android Adaptive Icon
  // foreground : le guide (fond transparent, safe zone 72dp sur 108dp → 66%)
  { file: 'android-icon-foreground.png', size: 1024, bg: null,  pad: 0.18 },
  // background : fond uni bleu foncé
  { file: 'android-icon-background.png', size: 1024, bg: '#07071A', blank: true },
  // monochrome : silhouette blanche sur noir (Themed Icon Android 13+)
  { file: 'android-icon-monochrome.png', size: 1024, bg: '#000000', mono: true },
];

async function generate() {
  if (!fs.existsSync(SRC)) {
    console.error('❌  icon.svg introuvable :', SRC);
    process.exit(1);
  }

  console.log('🎨  Génération des icônes Oracle Plus...\n');

  for (const t of targets) {
    const outPath = path.join(OUT, t.file);

    try {
      let pipeline = sharp(SRC);

      // Fond de couleur si demandé
      if (t.bg && !t.blank) {
        pipeline = pipeline.flatten({ background: hexToRgb(t.bg) });
      }

      // Padding pour l'adaptive icon foreground
      if (t.pad) {
        const inner = Math.round(t.size * (1 - t.pad * 2));
        pipeline = sharp(SRC)
          .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .extend({
            top:    Math.round(t.size * t.pad),
            bottom: Math.round(t.size * t.pad),
            left:   Math.round(t.size * t.pad),
            right:  Math.round(t.size * t.pad),
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          });
      } else if (!t.blank) {
        pipeline = pipeline.resize(t.size, t.size, {
          fit: 'cover',
          background: t.bg ? hexToRgb(t.bg) : { r: 0, g: 0, b: 0, alpha: 0 },
        });
      }

      // Fond uni (background uniquement, sans icône)
      if (t.blank) {
        const rgb = hexToRgb(t.bg);
        await sharp({
          create: {
            width:      t.size,
            height:     t.size,
            channels:   3,
            background: rgb,
          },
        }).png().toFile(outPath);
        console.log(`  ✅  ${t.file.padEnd(36)} ${t.size}×${t.size}  (fond uni)`);
        continue;
      }

      // Monochrome : convertir en niveaux de gris blanc sur fond noir
      if (t.mono) {
        pipeline = sharp(SRC)
          .resize(t.size, t.size, { fit: 'cover' })
          .flatten({ background: { r: 0, g: 0, b: 0 } })
          .grayscale()
          .normalize();
      }

      await pipeline.png().toFile(outPath);
      console.log(`  ✅  ${t.file.padEnd(36)} ${t.size}×${t.size}`);

    } catch (err) {
      console.error(`  ❌  ${t.file} : ${err.message}`);
    }
  }

  console.log('\n🚀  Terminé ! Redémarre Expo pour voir les nouvelles icônes.\n');
}

// Hex (#RRGGBB) → { r, g, b }
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

generate().catch(console.error);
