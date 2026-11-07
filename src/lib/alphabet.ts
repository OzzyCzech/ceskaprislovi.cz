import { normalize } from './normalize';

export const letters = 'A B C Č D E F G H Ch I J K L M N O P R Ř S Š T U V Z Ž …'.split(' ');
const listedLetters = new Set(letters);

export function initialLetter(text: string) {
  const first = text.normalize('NFC').match(/^[^\p{L}\p{N}]*(\p{L}|\p{N})(\p{L})?/u);
  if (!first) return '…';
  const letter = first[1].toLocaleUpperCase('cs');
  if (letter === 'C' && first[2]?.toLowerCase() === 'h') return 'Ch';
  if (listedLetters.has(letter)) return letter;
  const base = normalize(letter).toUpperCase();
  return listedLetters.has(base) ? base : '…';
}
