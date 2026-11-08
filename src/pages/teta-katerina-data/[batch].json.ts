import type { APIContext } from 'astro';
import type { ProverbLink } from '../../lib/catalog';
import { tetaBatches } from '../../lib/teta-batches';

export function getStaticPaths() {
  return tetaBatches.map((entries, batch) => ({
    params: { batch: String(batch) },
    props: { entries },
  }));
}

export function GET({ props }: APIContext<{ entries: ProverbLink[] }>) {
  return Response.json(props.entries);
}
