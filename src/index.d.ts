// Copyright (c) 2026 TokenJunction LLC. All rights reserved.

export type Capability = 'read' | 'write' | 'subscribe' | 'health';

export interface ConnectorManifest {
  schemaVersion: 1;
  name: string;
  version: string;
  description: string;
  entry: string;
  capabilities: Capability[];
}

export interface ValidationProblem {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationProblem[];
}

/** Returns an independent clone of the manifest JSON schema. */
export function connectorManifestSchema(): Record<string, unknown>;
/** Validates unknown input; does not execute a connector or return a manifest. */
export function validateManifest(value: unknown): ValidationResult;
/** Parses and validates JSON; non-string input returns a validation error. */
export function parseManifest(text: unknown): ValidationResult;
