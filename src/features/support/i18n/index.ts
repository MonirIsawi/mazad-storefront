import type { NamespaceBundles } from '@shared/hooks';

export const SUPPORT_NAMESPACE = 'support';

export async function loadSupportNamespace(): Promise<NamespaceBundles> {
  const [en, ar] = await Promise.all([
    import('./en.json').then((m) => m.default),
    import('./ar.json').then((m) => m.default),
  ]);
  return { en, ar };
}
