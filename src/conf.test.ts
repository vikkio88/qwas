import { describe, expect, test } from "bun:test";
import { CONF_DIRNAME, DB_FILENAME, SNIPPETS_DIRNAME } from "./conf.js";

describe("conf", () => {
  test("exposes the expected constants", () => {
    expect(CONF_DIRNAME).toBe(".qwas");
    expect(DB_FILENAME).toBe("db.json");
    expect(SNIPPETS_DIRNAME).toBe("snippets");
  });
});
