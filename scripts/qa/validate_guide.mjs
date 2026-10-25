// validate_guide.mjs - JSON Schema validation for structured guide JSON (Ajv, 2020-12).
//
// The pipeline compiles scripts/content/schema.json with compileSchemaFile() and passes the validator in.

import { readFileSync, existsSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

/** Compiles any 2020-12 JSON Schema file into a validator function. */
export function compileSchemaFile(schemaPath) {
  if (!existsSync(schemaPath)) throw new Error(`Schema file not found at: ${schemaPath}`);
  const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  return new Ajv2020({ allErrors: true, strict: false }).compile(schema);
}

/** Schema errors for an in-memory value: [{ path: string[], message }], sorted by path. */
export function validateInstance(instance, validate) {
  validate(instance);
  const errors = (validate.errors ?? []).map((err) => ({
    path: err.instancePath.split("/").slice(1),
    message: err.message,
  }));
  errors.sort((a, b) => a.path.join("/").localeCompare(b.path.join("/")));
  return errors;
}

/** Returns error message strings for one JSON guide file (empty when valid). */
export function validateFile(filePath, validate) {
  let instance;
  try {
    instance = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (e) {
    return [`JSON Parse Error: ${e.message}`];
  }
  return validateInstance(instance, validate).map((err) =>
    `[${err.path.length ? err.path.join("/") : "root"}] ${err.message}`);
}
