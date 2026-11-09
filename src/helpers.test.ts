import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import { Readable, Writable } from "stream";
import {
  col,
  copyToClipboard,
  findById,
  getConfigDir,
  getDbFileName,
  getSnippetFileName,
  getSnippetsDir,
  install,
  isInstalled,
  isTagQuery,
  l,
  parseQuery,
  parseTags,
  printCommand,
  promptForChoice,
  readDb,
  readLineSync,
  readSnippet,
  removeSnippet,
  saveDb,
  searchCommands,
  writeSnippet,
} from "./helpers.js";

function mockInput(answer: string): NodeJS.ReadableStream {
  return Readable.from([`${answer}\n`]);
}

const sink = new Writable({
  write(_chunk, _enc, callback) {
    callback();
  },
});

const sample: Command = {
  id: 1,
  description: "get a file size",
  tags: ["memory", "file", "size"],
  createdAt: new Date(),
};

const db: Db = {
  lastId: 2,
  commands: [
    sample,
    {
      id: 2,
      description: "check memory",
      tags: ["memory", "ram"],
      createdAt: new Date(),
    },
  ],
};

describe("path helpers", () => {
  const originalHome = process.env.HOME;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "qwas-paths-"));

  beforeEach(() => {
    process.env.HOME = tmpDir;
  });

  afterEach(() => {
    process.env.HOME = originalHome;
  });

  test("getConfigDir returns ~/.qwas", () => {
    expect(getConfigDir()).toBe(path.join(tmpDir, ".qwas"));
  });

  test("getDbFileName returns ~/.qwas/db.json", () => {
    expect(getDbFileName()).toBe(path.join(tmpDir, ".qwas", "db.json"));
  });

  test("getSnippetsDir returns ~/.qwas/snippets", () => {
    expect(getSnippetsDir()).toBe(path.join(tmpDir, ".qwas", "snippets"));
  });

  test("getSnippetFileName returns ~/.qwas/snippets/<id>.sh", () => {
    expect(getSnippetFileName(42)).toBe(
      path.join(tmpDir, ".qwas", "snippets", "42.sh"),
    );
  });
});

describe("install / isInstalled / seeding", () => {
  const originalHome = process.env.HOME;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "qwas-install-"));
    process.env.HOME = tmpDir;
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("isInstalled is false before install", () => {
    expect(isInstalled()).toBe(false);
  });

  test("install creates the config dir and snippets dir", () => {
    install();
    expect(fs.existsSync(getConfigDir())).toBe(true);
    expect(fs.existsSync(getSnippetsDir())).toBe(true);
    expect(fs.existsSync(getDbFileName())).toBe(true);
  });

  test("install returns true the first time, false if already installed", () => {
    expect(install()).toBe(true);
    expect(isInstalled()).toBe(true);
    expect(install()).toBe(false);
  });

  test("install seeds the db with example commands", () => {
    install();
    const seeded = readDb();
    expect(seeded.commands.length).toBeGreaterThan(0);
    expect(seeded.lastId).toBe(seeded.commands.length);
    for (const c of seeded.commands) {
      expect(fs.existsSync(getSnippetFileName(c.id))).toBe(true);
      expect(readSnippet(c.id).length).toBeGreaterThan(0);
    }
  });

  test("install does not reseed or wipe existing commands on second call", () => {
    install();
    const before = readDb();
    const db = readDb();
    db.commands.push({
      id: db.lastId + 1,
      description: "custom",
      tags: ["custom"],
      createdAt: new Date(),
    });
    db.lastId += 1;
    saveDb(db);
    writeSnippet(db.lastId, "echo custom");

    install();
    const after = readDb();
    expect(after.commands.length).toBe(before.commands.length + 1);
  });
});

describe("db read/write", () => {
  const originalHome = process.env.HOME;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "qwas-db-"));
    process.env.HOME = tmpDir;
    install();
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("saveDb persists and readDb reads it back", () => {
    const newDb: Db = { lastId: 1, commands: [sample] };
    saveDb(newDb);
    const reloaded = readDb();
    expect(reloaded.lastId).toBe(newDb.lastId);
    expect(reloaded.commands).toHaveLength(1);
    expect(reloaded.commands[0].id).toBe(sample.id);
    expect(reloaded.commands[0].description).toBe(sample.description);
    expect(reloaded.commands[0].tags).toEqual(sample.tags);
  });

  test("findById finds an existing command", () => {
    const newDb: Db = { lastId: 2, commands: db.commands };
    expect(findById(newDb, 2)?.description).toBe("check memory");
  });

  test("findById returns null for a missing id", () => {
    const newDb: Db = { lastId: 2, commands: db.commands };
    expect(findById(newDb, 999)).toBe(null);
  });
});

describe("snippet read/write/remove", () => {
  const originalHome = process.env.HOME;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "qwas-snippets-"));
    process.env.HOME = tmpDir;
    install();
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("writeSnippet then readSnippet roundtrips the command text", () => {
    writeSnippet(123, "du -h .");
    expect(readSnippet(123)).toBe("du -h .");
  });

  test("removeSnippet deletes the snippet file", () => {
    writeSnippet(123, "du -h .");
    expect(fs.existsSync(getSnippetFileName(123))).toBe(true);
    removeSnippet(123);
    expect(fs.existsSync(getSnippetFileName(123))).toBe(false);
  });

  test("removeSnippet is a no-op if the file does not exist", () => {
    expect(() => removeSnippet(99999)).not.toThrow();
  });
});

describe("parseTags", () => {
  test("splits, trims and lowercases a comma separated list", () => {
    expect(parseTags(" Memory, File ,size")).toEqual(["memory", "file", "size"]);
  });

  test("filters out empty entries", () => {
    expect(parseTags("memory,,file")).toEqual(["memory", "file"]);
  });

  test("returns an empty array for an empty string", () => {
    expect(parseTags("")).toEqual([]);
  });

  test("returns an empty array for a string of only commas/spaces", () => {
    expect(parseTags(" , , ")).toEqual([]);
  });
});

describe("isTagQuery / parseQuery", () => {
  test("detects a tag query", () => {
    expect(isTagQuery("t:memory")).toBe(true);
    expect(isTagQuery("memory")).toBe(false);
  });

  test("isTagQuery is false for an empty string", () => {
    expect(isTagQuery("")).toBe(false);
  });

  test("parses a plain query into lowercase terms", () => {
    expect(parseQuery("memory, file, size")).toEqual({
      terms: ["memory", "file", "size"],
      tagsOnly: false,
    });
  });

  test("parses a plain query separated by spaces", () => {
    expect(parseQuery("memory file size")).toEqual({
      terms: ["memory", "file", "size"],
      tagsOnly: false,
    });
  });

  test("parses a tag query", () => {
    expect(parseQuery("t:memory,file")).toEqual({
      terms: ["memory", "file"],
      tagsOnly: true,
    });
  });

  test("parses an empty query into no terms", () => {
    expect(parseQuery("")).toEqual({ terms: [], tagsOnly: false });
  });
});

describe("searchCommands", () => {
  test("matches by description", () => {
    const results = searchCommands(db, "file size");
    expect(results.map((c) => c.id)).toEqual([1]);
  });

  test("matches by tag", () => {
    const results = searchCommands(db, "ram");
    expect(results.map((c) => c.id)).toEqual([2]);
  });

  test("matches multiple entries sharing a term", () => {
    const results = searchCommands(db, "memory");
    expect(results.map((c) => c.id)).toEqual([1, 2]);
  });

  test("t: prefix only matches tags, not description", () => {
    expect(searchCommands(db, "t:memory").map((c) => c.id)).toEqual([1, 2]);
    expect(searchCommands(db, "t:ram").map((c) => c.id)).toEqual([2]);
  });

  test("t: prefix does not match on description-only words", () => {
    expect(searchCommands(db, "t:get").map((c) => c.id)).toEqual([]);
  });

  test("returns empty array for empty query", () => {
    expect(searchCommands(db, "")).toEqual([]);
  });

  test("returns empty array for a query with no matches", () => {
    expect(searchCommands(db, "nonexistent")).toEqual([]);
  });

  test("is case-insensitive", () => {
    expect(searchCommands(db, "MEMORY").map((c) => c.id)).toEqual([1, 2]);
  });

  test("does not duplicate a command matching multiple terms", () => {
    expect(searchCommands(db, "memory ram").map((c) => c.id)).toEqual([1, 2]);
  });
});

describe("promptForChoice", () => {
  const matches: Command[] = [
    { id: 1, description: "a", tags: [], createdAt: new Date() },
    { id: 5, description: "b", tags: [], createdAt: new Date() },
  ];

  test("returns the matching command for a valid id", async () => {
    const result = await promptForChoice(matches, mockInput("5"), sink);
    expect(result?.id).toBe(5);
  });

  test("returns null when the id is not among the matches", async () => {
    const result = await promptForChoice(matches, mockInput("99"), sink);
    expect(result).toBe(null);
  });

  test("returns null for non-numeric input", async () => {
    const result = await promptForChoice(matches, mockInput("nope"), sink);
    expect(result).toBe(null);
  });

  test("returns null for an empty answer", async () => {
    const result = await promptForChoice(matches, mockInput(""), sink);
    expect(result).toBe(null);
  });
});

describe("readLineSync", () => {
  test("resolves with the entered line", async () => {
    const result = await readLineSync("prompt: ", mockInput("hello"), sink);
    expect(result).toBe("hello");
  });
});

describe("copyToClipboard", () => {
  test("does not throw even if the clipboard is unavailable", () => {
    expect(() => copyToClipboard("echo hi")).not.toThrow();
  });
});

describe("printCommand / l", () => {
  test("does not throw for a command without tags", () => {
    expect(() =>
      printCommand({ id: 1, description: "no tags", tags: [], createdAt: new Date() }, "echo hi"),
    ).not.toThrow();
  });

  test("does not throw for a command with tags", () => {
    expect(() => printCommand(sample, "du -h .")).not.toThrow();
  });

  test("l does not throw", () => {
    expect(() => l("hello")).not.toThrow();
  });
});

describe("col", () => {
  test("exposes the expected color helpers", () => {
    expect(typeof col.cg).toBe("function");
    expect(typeof col.cr).toBe("function");
    expect(typeof col.b).toBe("function");
    expect(typeof col.i).toBe("function");
  });
});
