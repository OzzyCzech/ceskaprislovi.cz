# Česká přísloví

Statický web s českými příslovími a pořekadly z druhého vydání Čelakovského *Mudrosloví* z roku 1893.

## Vývoj

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm preview
```

Vstupem je `src/data/prislovi.json`. Astro z něj generuje HTML detail každého unikátního znění, sitemapu a index pro hledání v prohlížeči. Stejná znění sdílí stránku a jejich tagy se sloučí. Soubor je pracovní přepis z OCR; volitelný klíč `meaning` doplní na detailu výklad. Mapa `preferredWording` v `src/lib/proverbs.ts` sloučí starší znění pod dnešní podobu (starší se zobrazí jako „Jiné znění“) a novodobá varianta je tam uvedená odděleně.

Přísloví dne a seznam „Známá přísloví“ na úvodu se řídí sadou 365 přísloví v `src/data/zname.json`: den 1 je 6. listopadu 2026, každý další den posune pořadí o jedno a seznam ukazuje přísloví předchozích dnů od nejnovějšího (na začátku se doplňuje od konce sady). Pořadí se počítá z data návštěvníka v prohlížeči, takže statický build nezastará. Přehledová tabulka se generuje do `data/zname-365.md`.

Hledání běží v prohlížeči nad `prislovi-index.json` pomocí [uFuzzy](https://github.com/leeoniya/uFuzzy): výsledky se zobrazují při psaní, nejdřív přesné shody, při malém počtu výsledků i shody s překlepem. Obrázky PNG vznikají v prohlížeči, kde se také stahují nebo sdílí přes systémovou nabídku, pokud ji zařízení podporuje.

Build používá `build.format: 'file'` (`slug.html` místo `slug/index.html`), protože GitHub Pages jinak přesměrovává adresy bez lomítka na adresy s lomítkem, což by rozbilo kanonické URL.

## GitHub Pages

Workflow `.github/workflows/pages.yml` sestaví web a nasadí `dist` při pushi na větev `main`. V nastavení repozitáře v **Settings → Pages** nastavte **Source → GitHub Actions** a jako **Custom domain** zadejte `ceskaprislovi.cz`. U správce domény nasměrujte DNS na GitHub Pages podle [dokumentace GitHubu](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). Po ověření domény zapněte **Enforce HTTPS**.
