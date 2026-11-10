// Copyright (c) 2026 TokenJunction LLC. All rights reserved.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  connectorManifestSchema,
  parseManifest,
  validateManifest,
} from "../src/index.js";

function validManifest() {
  return {
    schemaVersion: 1,
    name: "sample-connector",
    version: "1.2.3",
    description: "Reads example records.",
    entry: "index.js",
    capabilities: ["read"],
  };
}

function messages(result, path) {
  return result.errors.filter((error) => error.path === path).map((error) => error.message);
}

describe("connector manifest schema", () => {
  it("publishes a clone of the schema document", () => {
    const schema = connectorManifestSchema();
    assert.equal(schema.$comment, "Copyright (c) 2026 TokenJunction LLC. All rights reserved.");
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(schema.required, [
      "schemaVersion",
      "name",
      "version",
      "description",
      "entry",
      "capabilities",
    ]);
    assert.equal(schema.properties.schemaVersion.const, 1);
    assert.equal(schema.properties.name.maxLength, 64);
    assert.equal(schema.properties.version.pattern.includes("\\d"), true);
    assert.equal(schema.properties.description.maxLength, 280);
    assert.equal(schema.properties.entry.maxLength, 128);
    assert.equal(schema.properties.capabilities.minItems, 1);
    assert.equal(schema.properties.capabilities.uniqueItems, true);
    assert.deepEqual(schema.properties.capabilities.items.enum, [
      "read",
      "write",
      "subscribe",
      "health",
    ]);
    schema.properties.name.pattern = "^$";
    assert.equal(validateManifest(validManifest()).ok, true);
  });
});

describe("validateManifest", () => {
  it("accepts a complete manifest", () => {
    const result = validateManifest({
      ...validManifest(),
      name: "a-b",
      entry: "./src/main.mjs",
      capabilities: ["read", "write", "subscribe", "health"],
    });
    assert.deepEqual(result, { ok: true, errors: [] });
  });

  it("rejects values that are not objects", () => {
    assert.deepEqual(messages(validateManifest(null), ""), ["must be an object"]);
    assert.deepEqual(messages(validateManifest(1), ""), ["must be an object"]);
    assert.deepEqual(messages(validateManifest([]), ""), ["must be an object"]);
    assert.deepEqual(messages(validateManifest("nope"), ""), ["must be an object"]);
  });

  it("reports every missing required field", () => {
    const result = validateManifest({});
    for (const key of connectorManifestSchema().required) {
      assert.deepEqual(messages(result, `/${key}`), ["is required"]);
    }
  });

  it("rejects unknown fields without treating them as prototype pollution", () => {
    const payload = validManifest();
    payload.endpoint = "https://example.invalid";
    Object.defineProperty(payload, "__proto__", {
      value: { polluted: true },
      enumerable: true,
    });
    const result = parseManifest(JSON.stringify(payload));
    assert.deepEqual(messages(result, "/endpoint"), ["is not allowed"]);
    assert.deepEqual(messages(result, "/__proto__"), ["is not allowed"]);
    assert.equal(Object.prototype.polluted, undefined);
  });

  it("checks schemaVersion", () => {
    const cases = [
      ["1", "must be an integer"],
      [1.5, "must be an integer"],
      [true, "must be an integer"],
      [2, "must be 1"],
    ];
    for (const [schemaVersion, message] of cases) {
      const result = validateManifest({ ...validManifest(), schemaVersion });
      assert.deepEqual(messages(result, "/schemaVersion"), [message]);
    }
    assert.equal(validateManifest(validManifest()).ok, true);
  });

  it("checks name length and pattern", () => {
    assert.deepEqual(messages(validateManifest({ ...validManifest(), name: 1 }), "/name"), [
      "must be a string",
    ]);
    const empty = validateManifest({ ...validManifest(), name: "" });
    assert.deepEqual(messages(empty, "/name"), [
      "must be at least 1 characters",
      "must match the required pattern",
    ]);
    assert.deepEqual(
      messages(validateManifest({ ...validManifest(), name: "A" }), "/name"),
      ["must match the required pattern"],
    );
    assert.deepEqual(
      messages(validateManifest({ ...validManifest(), name: "-a" }), "/name"),
      ["must match the required pattern"],
    );
    assert.deepEqual(
      messages(validateManifest({ ...validManifest(), name: "a-" }), "/name"),
      ["must match the required pattern"],
    );
    assert.deepEqual(
      messages(validateManifest({ ...validManifest(), name: "a--b" }), "/name"),
      ["must match the required pattern"],
    );
    const longName = "a".repeat(65);
    assert.deepEqual(messages(validateManifest({ ...validManifest(), name: longName }), "/name"), [
      "must be at most 64 characters",
    ]);
    assert.equal(validateManifest({ ...validManifest(), name: "a".repeat(64) }).ok, true);
  });

  it("checks version pattern and skips length limits the schema does not set", () => {
    assert.equal(connectorManifestSchema().properties.version.minLength, undefined);
    assert.equal(connectorManifestSchema().properties.version.maxLength, undefined);
    for (const version of ["1.2", "01.2.3", "1.2.3-beta", "v1.2.3"]) {
      assert.deepEqual(
        messages(validateManifest({ ...validManifest(), version }), "/version"),
        ["must match the required pattern"],
      );
    }
    assert.deepEqual(
      messages(validateManifest({ ...validManifest(), version: 1 }), "/version"),
      ["must be a string"],
    );
    assert.equal(validateManifest({ ...validManifest(), version: "0.0.0" }).ok, true);
  });

  it("checks description length and not a pattern", () => {
    assert.equal(connectorManifestSchema().properties.description.pattern, undefined);
    assert.deepEqual(
      messages(validateManifest({ ...validManifest(), description: "" }), "/description"),
      ["must be at least 1 characters"],
    );
    assert.deepEqual(
      messages(validateManifest({ ...validManifest(), description: "a".repeat(281) }), "/description"),
      ["must be at most 280 characters"],
    );
    assert.deepEqual(
      messages(validateManifest({ ...validManifest(), description: 1 }), "/description"),
      ["must be a string"],
    );
    assert.equal(validateManifest({ ...validManifest(), description: "a".repeat(280) }).ok, true);
  });

  it("checks entry paths", () => {
    for (const entry of ["index.js", "src/main.mjs", "a.b.js", "./index.js"]) {
      assert.equal(validateManifest({ ...validManifest(), entry }).ok, true, entry);
    }
    for (const entry of ["../index.js", "/etc/passwd.js", "index.ts", "foo\\index.js", "//index.js", "index.js/"]) {
      assert.deepEqual(
        messages(validateManifest({ ...validManifest(), entry }), "/entry"),
        ["must match the required pattern"],
        entry,
      );
    }
    assert.deepEqual(messages(validateManifest({ ...validManifest(), entry: "" }), "/entry"), [
      "must be at least 1 characters",
      "must match the required pattern",
    ]);
    const tooLong = `${"a".repeat(126)}.js`;
    assert.equal(tooLong.length, 129);
    assert.deepEqual(messages(validateManifest({ ...validManifest(), entry: tooLong }), "/entry"), [
      "must be at most 128 characters",
    ]);
    assert.equal(validateManifest({ ...validManifest(), entry: `${"a".repeat(125)}.js` }).ok, true);
    assert.deepEqual(messages(validateManifest({ ...validManifest(), entry: 1 }), "/entry"), [
      "must be a string",
    ]);
  });

  it("checks capabilities", () => {
    assert.deepEqual(
      messages(validateManifest({ ...validManifest(), capabilities: "read" }), "/capabilities"),
      ["must be an array"],
    );
    assert.deepEqual(
      messages(validateManifest({ ...validManifest(), capabilities: [] }), "/capabilities"),
      ["must contain at least 1 item"],
    );
    const mixed = validateManifest({
      ...validManifest(),
      capabilities: ["read", "nope", 1, "read"],
    });
    assert.deepEqual(messages(mixed, "/capabilities/1"), [
      "must be one of read, write, subscribe, health",
    ]);
    assert.deepEqual(messages(mixed, "/capabilities/2"), [
      "must be one of read, write, subscribe, health",
    ]);
    assert.deepEqual(messages(mixed, "/capabilities"), ["must contain unique items"]);
    assert.equal(validateManifest(validManifest()).ok, true);
  });
});

describe("parseManifest", () => {
  it("parses valid JSON text", () => {
    const text = JSON.stringify(validManifest());
    assert.deepEqual(parseManifest(text), validateManifest(validManifest()));
  });

  it("rejects non-strings and invalid JSON", () => {
    assert.deepEqual(parseManifest(null), {
      ok: false,
      errors: [{ path: "", message: "manifest text must be a string" }],
    });
    assert.deepEqual(parseManifest("{"), {
      ok: false,
      errors: [{ path: "", message: "manifest is not valid JSON" }],
    });
    assert.deepEqual(messages(parseManifest("null"), ""), ["must be an object"]);
  });
});
