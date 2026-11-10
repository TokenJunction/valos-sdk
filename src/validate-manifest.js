// Copyright (c) 2026 TokenJunction LLC. All rights reserved.

import { readFileSync } from "node:fs";
import { URL } from "node:url";

const schema = JSON.parse(
  readFileSync(new URL("../schema/connector-manifest.schema.json", import.meta.url), "utf8"),
);

export function connectorManifestSchema() {
  return globalThis.structuredClone(schema);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function checkString(value, propertySchema, path, errors) {
  if (typeof value !== "string") {
    errors.push({ path, message: "must be a string" });
    return;
  }
  if (typeof propertySchema.minLength === "number" && value.length < propertySchema.minLength) {
    errors.push({
      path,
      message: `must be at least ${propertySchema.minLength} characters`,
    });
  }
  if (typeof propertySchema.maxLength === "number" && value.length > propertySchema.maxLength) {
    errors.push({
      path,
      message: `must be at most ${propertySchema.maxLength} characters`,
    });
  }
  if (typeof propertySchema.pattern === "string") {
    const expression = new RegExp(propertySchema.pattern, "u");
    if (!expression.test(value)) {
      errors.push({ path, message: "must match the required pattern" });
    }
  }
}

function checkSchemaVersion(value, propertySchema, path, errors) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    errors.push({ path, message: "must be an integer" });
    return;
  }
  if (value !== propertySchema.const) {
    errors.push({ path, message: `must be ${propertySchema.const}` });
  }
}

function checkCapabilities(value, propertySchema, path, errors) {
  if (!Array.isArray(value)) {
    errors.push({ path, message: "must be an array" });
    return;
  }
  if (value.length < propertySchema.minItems) {
    errors.push({
      path,
      message: `must contain at least ${propertySchema.minItems} item`,
    });
  }
  const allowed = propertySchema.items.enum;
  const seen = new Set();
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (typeof item !== "string" || !allowed.includes(item)) {
      errors.push({
        path: `${path}/${index}`,
        message: `must be one of ${allowed.join(", ")}`,
      });
    }
    const key = JSON.stringify(item);
    if (seen.has(key)) {
      errors.push({ path, message: "must contain unique items" });
    } else {
      seen.add(key);
    }
  }
}

export function validateManifest(value) {
  const errors = [];
  if (!isPlainObject(value)) {
    errors.push({ path: "", message: "must be an object" });
    return { ok: false, errors };
  }

  const properties = schema.properties;
  for (const key of schema.required) {
    if (!Object.hasOwn(value, key)) {
      errors.push({ path: `/${key}`, message: "is required" });
    }
  }
  for (const key of Object.keys(value)) {
    if (!Object.hasOwn(properties, key)) {
      errors.push({ path: `/${key}`, message: "is not allowed" });
    }
  }
  if (Object.hasOwn(value, "schemaVersion")) {
    checkSchemaVersion(value.schemaVersion, properties.schemaVersion, "/schemaVersion", errors);
  }
  if (Object.hasOwn(value, "name")) {
    checkString(value.name, properties.name, "/name", errors);
  }
  if (Object.hasOwn(value, "version")) {
    checkString(value.version, properties.version, "/version", errors);
  }
  if (Object.hasOwn(value, "description")) {
    checkString(value.description, properties.description, "/description", errors);
  }
  if (Object.hasOwn(value, "entry")) {
    checkString(value.entry, properties.entry, "/entry", errors);
  }
  if (Object.hasOwn(value, "capabilities")) {
    checkCapabilities(value.capabilities, properties.capabilities, "/capabilities", errors);
  }

  return { ok: errors.length === 0, errors };
}

export function parseManifest(text) {
  if (typeof text !== "string") {
    return {
      ok: false,
      errors: [{ path: "", message: "manifest text must be a string" }],
    };
  }
  try {
    return validateManifest(JSON.parse(text));
  } catch {
    return {
      ok: false,
      errors: [{ path: "", message: "manifest is not valid JSON" }],
    };
  }
}
