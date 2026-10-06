import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { usefulnessJsonSchema, worksheetJsonSchema } from "../../server/schemas.mjs";

// Temporary: guards the checked-in schema files until F2 removes zod and they become the only source.
const schemasDir = new URL("../../src/MathRecap.Api/Ai/Schemas/", import.meta.url);
const readSchema = (fileName) => JSON.parse(readFileSync(new URL(fileName, schemasDir), "utf8"));

test("checked-in model output schemas match the zod schemas", () => {
  assert.deepEqual(readSchema("worksheet.schema.json"), worksheetJsonSchema);
  assert.deepEqual(readSchema("usefulness.schema.json"), usefulnessJsonSchema);
});
