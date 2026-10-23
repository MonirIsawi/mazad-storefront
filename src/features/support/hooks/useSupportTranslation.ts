'use client';

import { useNamespaceTranslation } from '@shared/hooks';
import { SUPPORT_NAMESPACE, loadSupportNamespace } from '../i18n';

export function useSupportTranslation() {
  return useNamespaceTranslation(SUPPORT_NAMESPACE, loadSupportNamespace);
}
