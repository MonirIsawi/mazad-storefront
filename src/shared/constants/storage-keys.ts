export const STORAGE_KEYS = {
  accessToken: 'mazad.accessToken',
  refreshToken: 'mazad.refreshToken',
  locale: 'mazad.locale',
  theme: 'mazad.theme',
  /** Set once the first-run welcome was shown (or skipped for a signed-in visitor). */
  welcomeSeen: 'mazad.welcomeSeen',
} as const;
