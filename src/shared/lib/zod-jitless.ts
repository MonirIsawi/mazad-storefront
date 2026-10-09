import { config } from 'zod';

/**
 * Zod 4 probes `new Function('')` once to decide whether to JIT-compile object parsers. Under the
 * storefront CSP (no 'unsafe-eval') that probe is blocked and logged as a CSP violation on every
 * page. Parsing works the same without the JIT, so skip the probe. Imported once by AppProviders,
 * before any schema parses.
 */
config({ jitless: true });
