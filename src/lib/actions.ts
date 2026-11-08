import { canShareFiles, proverbImage, saveImage } from './image';

const status = document.querySelector<HTMLElement>('#site-status');
let statusTimer: number | undefined;

export function announce(message: string) {
  if (!status) return;
  status.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => { status.textContent = ''; }, 4_000);
}

function flash(button: HTMLButtonElement, label: string) {
  const target = button.querySelector<HTMLElement>('[data-label]');
  if (!target) return;
  const original = target.textContent;
  target.textContent = label;
  setTimeout(() => { target.textContent = original; }, 1_800);
}

function source(element: Element) {
  const holder = element.closest<HTMLElement>('[data-proverb]');
  return holder ? { text: holder.dataset.proverb!, slug: holder.dataset.slug! } : undefined;
}

async function run(button: HTMLButtonElement) {
  const proverb = source(button);
  if (!proverb) return;
  const { text, slug } = proverb;
  const action = button.dataset.action;
  button.disabled = true;
  try {
    if (action === 'copy') {
      await navigator.clipboard.writeText(text);
      flash(button, 'Zkopírováno');
      announce('Přísloví zkopírováno do schránky.');
    } else if (action === 'link') {
      await navigator.clipboard.writeText(new URL(`/${slug}`, location.origin).href);
      flash(button, 'Zkopírováno');
      announce('Odkaz zkopírován do schránky.');
    } else if (action === 'download') {
      saveImage(await proverbImage(text, slug));
      announce('Obrázek PNG se stahuje.');
    } else if (action === 'share') {
      const data = { title: 'Česká přísloví', text, url: new URL(`/${slug}`, location.origin).href };
      if (typeof navigator.share === 'function') {
        const file = await proverbImage(text, slug);
        if (canShareFiles([file])) {
          await navigator.share({ ...data, files: [file] });
        } else {
          await navigator.share(data);
        }
      } else {
        await navigator.clipboard.writeText(data.url);
        announce('Odkaz ke sdílení zkopírován do schránky.');
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    announce(
      action === 'share'
        ? 'Sdílení se nepodařilo. Zkuste zkopírovat odkaz nebo stáhnout obrázek.'
        : action === 'copy' || action === 'link'
        ? 'Schránka není dostupná. Text můžete označit a zkopírovat ručně.'
        : 'Obrázek se nepodařilo vytvořit. Zkuste to znovu.',
    );
  } finally {
    button.disabled = false;
  }
}

document.addEventListener('click', (event) => {
  const button = (event.target as Element | null)?.closest?.<HTMLButtonElement>('button[data-action]');
  if (button) void run(button);
});

// Pre-render the image as soon as the visitor shows interest, so sharing stays inside the user-activation window.
function warm(event: Event) {
  const button = (event.target as Element | null)?.closest?.<HTMLButtonElement>('button[data-action="share"], button[data-action="download"]');
  const proverb = button && source(button);
  if (proverb) void proverbImage(proverb.text, proverb.slug).catch(() => {});
}
document.addEventListener('pointerenter', warm, true);
document.addEventListener('focusin', warm);
