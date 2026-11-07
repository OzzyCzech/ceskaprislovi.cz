const size = 1080;
const images = new Map<string, Promise<File>>();

function wrap(context: CanvasRenderingContext2D, value: string, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of value.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width <= width) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = '';
    for (const letter of word) {
      if (context.measureText(line + letter).width > width && line) {
        lines.push(line);
        line = '';
      }
      line += letter;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function render(text: string, name: string) {
  await document.fonts.load('900 130px "Figtree Variable"', text + ' Česká přísloví ceskaprislovi.cz');
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');

  const margin = 96;
  const width = size - margin * 2;
  context.fillStyle = '#f7f7f7';
  context.fillRect(0, 0, size, size);

  context.save();
  context.translate(108, 165);
  context.scale(1.32, 1.32);
  context.fillStyle = '#f54a00'; // Tailwind orange-600
  context.fill(new Path2D('M13 49h32v20c0 17-12 27-32 31V86c9-3 13-7 14-13H13zm44 0h32v20c0 17-12 27-32 31V86c9-3 13-7 14-13H57z'));
  context.restore();

  context.textBaseline = 'middle';
  let fontSize = 134;
  let lines: string[];
  while (true) {
    context.font = `900 ${fontSize}px "Figtree Variable", sans-serif`;
    context.letterSpacing = `${-fontSize * .035}px`;
    lines = wrap(context, text, width);
    if (lines.length * fontSize * .97 <= 470 || fontSize <= 16) break;
    fontSize -= 2;
  }

  const lineHeight = fontSize * .97;
  context.fillStyle = '#0c0c0c';
  for (const [index, line] of lines.entries()) {
    context.fillText(line, margin, 582 + (index - (lines.length - 1) / 2) * lineHeight);
  }

  context.fillRect(margin, 916, width, 2);
  context.font = '750 30px "Figtree Variable", sans-serif';
  context.letterSpacing = '0px';
  context.fillText('Česká přísloví', margin, 967);
  context.textAlign = 'right';
  context.fillStyle = '#535353';
  context.fillText('ceskaprislovi.cz', size - margin, 967);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG conversion failed')), 'image/png');
  });
  return new File([blob], name, { type: 'image/png' });
}

/** Renders (and caches) the shareable PNG of one proverb. */
export function proverbImage(text: string, slug: string) {
  let image = images.get(slug);
  if (!image) {
    image = render(text, `${slug}.png`).catch((error) => {
      images.delete(slug);
      throw error;
    });
    images.set(slug, image);
  }
  return image;
}

export function saveImage(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function canShareFiles(files: File[]) {
  return typeof navigator.share === 'function' && navigator.canShare?.({ files }) === true;
}
