import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { authResponseSchema, authUserSchema, otpRequestResultSchema } from './auth.schema';

/*
 * The storefront parses auth responses with Zod; a field the schema requires but the API does not
 * always send would make every login fail at run time. This checks the schemas against the API's
 * published OpenAPI contract (contracts/, refreshed with `npm run contracts:sync`).
 */
type OpenApiProperty = {
  nullable?: boolean;
  enum?: string[];
  $ref?: string;
  allOf?: OpenApiProperty[];
};
type OpenApiObject = { properties: Record<string, OpenApiProperty>; required?: string[] };

const contract = JSON.parse(
  readFileSync(join(process.cwd(), 'contracts', 'mazad-api.openapi.json'), 'utf8'),
) as { components: { schemas: Record<string, OpenApiObject> } };
const schemas = contract.components.schemas;

function apiSchema(name: string): OpenApiObject {
  const schema = schemas[name];
  if (!schema) throw new Error(`mazad-api contract has no schema ${name}`);
  return schema;
}

/** Enum values of a property, following `$ref` / `allOf: [$ref]` (how named enums are emitted). */
function enumValues(property: OpenApiProperty): string[] {
  if (property.enum) return property.enum;
  const ref = property.$ref ?? property.allOf?.find((part) => part.$ref)?.$ref;
  if (!ref) return [];
  return (
    (schemas[ref.replace('#/components/schemas/', '')] as OpenApiProperty | undefined)?.enum ?? []
  );
}

/** Every mismatch between a Zod object and the API schema it parses. */
function mismatches(zodObject: z.ZodObject, apiName: string): string[] {
  const api = apiSchema(apiName);
  const required = new Set(api.required ?? []);
  const problems: string[] = [];
  for (const [field, zodField] of Object.entries(zodObject.shape) as [string, z.ZodType][]) {
    const property = api.properties[field];
    if (!property) {
      problems.push(`${apiName}.${field}: not in the API contract`);
      continue;
    }
    const zodRequired = !zodField.safeParse(undefined).success;
    if (zodRequired && !required.has(field)) {
      problems.push(`${apiName}.${field}: required here, optional in the API`);
    }
    if (property.nullable && !zodField.safeParse(null).success) {
      problems.push(`${apiName}.${field}: the API may send null`);
    }
    for (const value of enumValues(property)) {
      if (!zodField.safeParse(value).success) {
        problems.push(`${apiName}.${field}: API value ${value} is rejected`);
      }
    }
  }
  return problems;
}

describe('auth schemas match the mazad-api contract', () => {
  it('session responses (login, register, refresh, OTP verify)', () => {
    expect(mismatches(authResponseSchema, 'AuthSessionResponseDto')).toEqual([]);
    expect(mismatches(authUserSchema, 'AuthUserDto')).toEqual([]);
  });

  it('OTP request result', () => {
    expect(mismatches(otpRequestResultSchema, 'OtpRequestResponseDto')).toEqual([]);
  });

  it('detects drift', () => {
    const drifted = authUserSchema.extend({});
    const contractCopy = structuredClone(apiSchema('AuthUserDto'));
    contractCopy.required = (contractCopy.required ?? []).filter((field) => field !== 'fullName');
    contractCopy.properties.role = { $ref: '#/components/schemas/__DriftRole' };
    schemas.__DriftProbe = contractCopy;
    schemas.__DriftRole = { enum: ['CUSTOMER', 'ADMIN', 'SELLER'] } as unknown as OpenApiObject;
    try {
      expect(mismatches(drifted, '__DriftProbe')).toEqual([
        '__DriftProbe.role: API value SELLER is rejected',
        '__DriftProbe.fullName: required here, optional in the API',
      ]);
    } finally {
      delete schemas.__DriftProbe;
      delete schemas.__DriftRole;
    }
  });
});
