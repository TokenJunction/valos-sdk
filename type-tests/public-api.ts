// Copyright (c) 2026 TokenJunction LLC. All rights reserved.
import { connectorManifestSchema, parseManifest, validateManifest } from '../src/index.js';
import type { Capability, ConnectorManifest, ValidationProblem, ValidationResult } from '../src/index.js';

const manifest: ConnectorManifest = {
  schemaVersion: 1, name: 'example', version: '0.1.0',
  description: 'Local manifest validation example', entry: './connector.mjs',
  capabilities: ['health'],
};
const result: ValidationResult = validateManifest(manifest);
const parsed: ValidationResult = parseManifest(JSON.stringify(manifest));
const unknownInput: ValidationResult = parseManifest(null);
const schema: Record<string, unknown> = connectorManifestSchema();
const problems: ValidationProblem[] = result.errors;
const ok: boolean = parsed.ok;
// @ts-expect-error Unsupported capability must be rejected.
const invalidCapability: Capability = 'execute';
// @ts-expect-error The API returns validation status, not the parsed manifest.
const returnedManifest: ConnectorManifest = parsed;
// @ts-expect-error Validation problems require a string path.
const invalidProblem: ValidationProblem = { path: 123, message: 'invalid' };
void [unknownInput, schema, problems, ok, invalidCapability, returnedManifest, invalidProblem];
