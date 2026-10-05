#!/usr/bin/env node
// Copies mazad-api's generated OpenAPI contract next to the code that types against it.
//   npm run contracts:sync            (expects ../mazad-api; override with MAZAD_API_DIR)
// Then run `npm test`: src/shared/api/contract.test.ts fails where the storefront's schemas
// no longer match the API. See mazad-api/docs/api-contracts.md.
import { copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = resolve(root, process.env.MAZAD_API_DIR ?? '../mazad-api');
const source = join(apiDir, 'openapi', 'mazad-api.json');
const target = join(root, 'contracts', 'mazad-api.openapi.json');
copyFileSync(source, target);
console.log(`Copied ${source} -> ${target}`);
