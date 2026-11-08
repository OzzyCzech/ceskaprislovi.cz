import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createCanvas, GlobalFonts, Path2D } from '@napi-rs/canvas';
import sharp from 'sharp';
import { wrap } from './wrap-text';

// Build-time renderer of the 1200×630 Open Graph image of one proverb. Mirrors the browser card in image.ts
// and public/social-preview.png: paper background, the favicon quote mark, Figtree Black text and the footer rule.
export const width = 1200;
export const height = 630;
const margin = 80;
const column = width - margin * 2;
const textTop = 205;
const textBottom = 495;

// Full Figtree variable font (fontsource ships only unicode-range subsets, which Skia cannot merge under one family).
GlobalFonts.register(readFileSync(resolve('src/assets/fonts/figtree-variable.ttf')), 'Figtree');

const canvas = createCanvas(width, height);
const context = canvas.getContext('2d');
const mark = new Path2D('M13 49h32v20c0 17-12 27-32 31V86c9-3 13-7 14-13H13zm44 0h32v20c0 17-12 27-32 31V86c9-3 13-7 14-13H57z');

function font(size: number) {
  context.font = `900 ${size}px Figtree`;
  context.letterSpacing = `${-size * .035}px`;
}

/** Renders the proverb as an 8-bit PNG. */
export async function renderOgImage(text: string) {
  context.fillStyle = '#f7f7f7';
  context.fillRect(0, 0, width, height);

  context.save();
  context.translate(margin, 104);
  context.scale(1.45, 1.45);
  context.translate(-13, -49);
  context.fillStyle = '#f54a00'; // Tailwind orange-600
  context.fill(mark);
  context.restore();

  const dotted = text.endsWith('.');
  const body = dotted ? text.slice(0, -1) : text;
  let size = 112;
  let lines: string[];
  while (true) {
    font(size);
    lines = wrap(context, body, column);
    if (lines.length * size * .97 <= textBottom - textTop || size <= 24) break;
    size -= 2;
  }

  const lineHeight = size * .97;
  const capHeight = context.measureText('H').actualBoundingBoxAscent;
  const blockHeight = (lines.length - 1) * lineHeight + capHeight;
  const baseline = (textTop + textBottom) / 2 - blockHeight / 2 + capHeight;
  context.textBaseline = 'alphabetic';
  context.textAlign = 'left';
  context.fillStyle = '#0c0c0c';
  for (const [index, line] of lines.entries()) {
    context.fillText(line, margin, baseline + index * lineHeight);
  }
  if (dotted) {
    // Same orange square that replaces the final period in the page headline (.display-dot).
    const last = lines.at(-1) ?? '';
    const x = margin + context.measureText(last).width + size * .08;
    const y = baseline + (lines.length - 1) * lineHeight;
    context.fillStyle = '#f54a00';
    context.fillRect(x, y - size * .15, size * .15, size * .15);
  }

  context.fillStyle = '#0c0c0c';
  context.fillRect(margin, 520, column, 2);
  context.font = '750 28px Figtree';
  context.letterSpacing = '0px';
  context.textBaseline = 'middle';
  context.fillText('Česká přísloví', margin, 566);
  context.textAlign = 'right';
  context.fillStyle = '#535353';
  context.fillText('ceskaprislovi.cz', width - margin, 566);

  return sharp(canvas.data(), { raw: { width, height, channels: 4 } })
    .png({ palette: true, colours: 16, dither: 0, compressionLevel: 9, effort: 4 })
    .toBuffer();
}
