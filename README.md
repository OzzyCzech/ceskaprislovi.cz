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

Náhled pro sociální sítě (`og:image`) má každé přísloví vlastní: `src/pages/og/[slug].png.ts` ho při buildu vykreslí přes `@napi-rs/canvas` a `sharp` do `dist/og/<slug>.png` (16barevné PNG, zhruba 11 KB). Renderer `src/lib/og-image.ts` sdílí zalamování textu s kartou v prohlížeči a používá plný variabilní font Figtree ze `src/assets/fonts/` (licence OFL), protože podmnožiny z fontsource nejdou v canvasu sloučit. Hotové PNG se ukládají do `.cache/og` (klíč z textu přísloví a z rendereru), v CI adresář drží `actions/cache`, takže se při deployi kreslí jen nová nebo změněná přísloví; první build bez cache trvá o několik minut déle.

Build používá `build.format: 'file'` (`slug.html` místo `slug/index.html`), protože GitHub Pages jinak přesměrovává adresy bez lomítka na adresy s lomítkem, což by rozbilo kanonické URL.

## GitHub Pages

Workflow `.github/workflows/pages.yml` ověří sestavení u pull requestů do `main`. Po pushi na `main` sestaví web a nasadí složku `dist` na GitHub Pages. Nasazení lze spustit i ručně přes **Actions → GitHub Pages → Run workflow** z větve `main`.

V nastavení repozitáře v **Settings → Pages** nastavte **Source → GitHub Actions** a jako **Custom domain** zadejte `ceskaprislovi.cz`. U správce domény nasměrujte DNS na GitHub Pages podle [dokumentace GitHubu](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). Po ověření domény zapněte **Enforce HTTPS**.
