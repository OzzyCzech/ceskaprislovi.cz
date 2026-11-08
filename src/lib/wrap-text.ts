type Measurer = { measureText(text: string): { width: number } };

/** Breaks text into lines no wider than `width`, splitting words that do not fit on their own. */
export function wrap(context: Measurer, value: string, width: number) {
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
