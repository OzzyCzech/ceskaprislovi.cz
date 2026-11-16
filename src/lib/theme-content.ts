import { proverbsByTheme } from './proverbs';

type ThemeContent = {
  title: string;
  description: string;
  intro: string;
  selection: string[];
};

const content: Record<string, ThemeContent> = {
  práce: {
    title: 'Přísloví o práci',
    description: 'Česká přísloví o práci, píli a odměně za úsilí. Výběr známých přísloví s vysvětlením významu a celá sbírka na jednom místě.',
    intro: 'Přísloví o práci připomínají, že výsledky vyžadují úsilí, a nabádají k píli i včasnému začátku. Zároveň varují před spěchem: nestačí jen pracovat rychle, záleží také na pečlivosti. Tady najdete známá přísloví s krátkým vysvětlením i další pořekadla o práci a každodenních povinnostech.',
    selection: [
      'Bez práce nejsou koláče.',
      'Komu se nelení, tomu se zelení.',
      'Ranní ptáče dál doskáče.',
      'Co můžeš udělat dnes, neodkládej na zítřek.',
      'Práce kvapná málo platná.',
    ],
  },
  láska: {
    title: 'Přísloví o lásce',
    description: 'Česká přísloví o lásce, věrnosti i trápení ve vztazích. Přečtěte si známá přísloví s významem a prohlédněte si celou sbírku.',
    intro: 'Přísloví o lásce mluví o síle citů, vzpomínkách i nesnázích, které vztahy přinášejí. Některá povzbuzují, jiná s nadsázkou připomínají, že láska dokáže člověka potěšit i potrápit. Vybraná známá přísloví doprovází vysvětlení významu; pod nimi najdete další přísloví a pořekadla z naší sbírky.',
    selection: [
      'Láska hory přenáší.',
      'Stará láska nerezaví.',
      'Láska jako růže není bez trní.',
      'Co se škádlívá, to se rádo mívá.',
      'Smůla ve hře, štěstí v lásce.',
    ],
  },
  přátelství: {
    title: 'Přísloví o přátelství',
    description: 'Česká přísloví o přátelství, důvěře a vzájemné pomoci. Známá přísloví s vysvětlením významu i další pořekadla o přátelích.',
    intro: 'Přísloví o přátelství ukazují, podle čeho poznat dobrého přítele: podle pomoci v nesnázích, upřímnosti a spolehlivosti. Připomínají také, že dobré vztahy potřebují jasné dohody, zvlášť když jde o peníze. Přečtěte si výběr známých přísloví s významem a prozkoumejte další pořekadla o přátelích i falešné přízni.',
    selection: [
      'V nouzi poznáš přítele.',
      'Přátelé buďme, dluhy si platme.',
      'Krátké účty, dlouzí přátelé.',
      'Přátelské služby se neúčtují.',
      'Lepší jest zjevný nepřítel, nežli úlisný přítel.',
    ],
  },
};

// Resolve against the theme's catalog so links and meanings share the detail data.
export const themeContent = new Map(Object.entries(content).map(([theme, entry]) => {
  const entries = proverbsByTheme.get(theme) ?? [];
  const selection = entry.selection.map((text) => {
    const proverb = entries.find((proverb) => proverb.text === text);
    if (!proverb?.meaning) throw new Error(`Vybrané přísloví v tématu „${theme}“ chybí nebo nemá výklad: ${text}`);
    return proverb;
  });
  return [theme, { ...entry, selection }] as const;
}));
