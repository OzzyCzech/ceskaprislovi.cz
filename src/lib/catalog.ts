export type ProverbLink = [slug: string, text: string];
export type Entry = [...ProverbLink, tags: string[], alternatives?: string[]];

let catalog: Promise<Entry[]> | undefined;
export function loadCatalog() {
  catalog ??= fetch('/prislovi-index.json')
    .then((response) => {
      if (!response.ok) throw new Error(`Search index HTTP ${response.status}`);
      return response.json() as Promise<Entry[]>;
    })
    .catch((error) => {
      catalog = undefined;
      throw error;
    });
  return catalog;
}
