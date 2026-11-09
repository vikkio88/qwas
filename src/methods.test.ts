import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import { Readable, Writable } from "stream";
import {
  getConfigDir,
  getSnippetFileName,
  readDb,
  readSnippet,
  saveDb,
  writeSnippet,
} from "./helpers.js";
import { add, install, list, q, remove, version } from "./methods.js";

function captureExit() {
  const originalExit = process.exit;
  let exitCode: number | undefined;
  // @ts-ignore
  process.exit = (code?: number) => {
    exitCode = code;
    throw new Error("exit");
  };
  return {
    restore: () => {
      process.exit = originalExit;
    },
    code: () => exitCode,
  };
}

describe("methods", () => {
  const originalHome = process.env.HOME;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "qwas-methods-"));
    process.env.HOME = tmpDir;
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("install", () => {
    test("creates the config dir on first run", () => {
      install();
      expect(fs.existsSync(getConfigDir())).toBe(true);
    });

    test("is idempotent on a second run", () => {
      install();
      install();
      expect(fs.existsSync(getConfigDir())).toBe(true);
    });
  });

  describe("version", () => {
    test("does not throw", () => {
      expect(() => version()).not.toThrow();
    });
  });

  describe("list", () => {
    test("does not throw with no commands", () => {
      install();
      saveDb({ lastId: 0, commands: [] });
      expect(() => list()).not.toThrow();
    });

    test("does not throw with seeded commands", () => {
      install();
      expect(() => list()).not.toThrow();
    });
  });

  describe("add", () => {
    test("adds a command with positional args", async () => {
      install();
      saveDb({ lastId: 0, commands: [] });

      await add(null, ["du -h .", "get a file size", "memory,file,size"]);

      const db = readDb();
      expect(db.commands.length).toBe(1);
      expect(db.commands[0].description).toBe("get a file size");
      expect(db.commands[0].tags).toEqual(["memory", "file", "size"]);
      expect(readSnippet(db.commands[0].id)).toBe("du -h .");
    });

    test("increments ids across multiple adds", async () => {
      install();
      saveDb({ lastId: 0, commands: [] });

      await add(null, ["echo one", "one", "a"]);
      await add(null, ["echo two", "two", "b"]);

      const db = readDb();
      expect(db.commands.map((c) => c.id)).toEqual([1, 2]);
      expect(db.lastId).toBe(2);
    });

    test("defaults description and tags when omitted", async () => {
      install();
      saveDb({ lastId: 0, commands: [] });

      await add(null, ["echo hi"]);

      const db = readDb();
      expect(db.commands[0].description).toBe("");
      expect(db.commands[0].tags).toEqual([]);
    });

    test("prompts interactively when called with no args", async () => {
      install();
      saveDb({ lastId: 0, commands: [] });

      const input = Readable.from(["echo hi\n", "say hi\n", "greet,demo\n"]);
      const sink = new Writable({
        write(_chunk, _enc, callback) {
          callback();
        },
      });

      await add(null, [], { input, output: sink });

      const db = readDb();
      expect(db.commands[0].description).toBe("say hi");
      expect(db.commands[0].tags).toEqual(["greet", "demo"]);
      expect(readSnippet(db.commands[0].id)).toBe("echo hi");
    });

    test("exits with an error when the interactive command answer is empty", async () => {
      install();
      saveDb({ lastId: 0, commands: [] });
      const exit = captureExit();

      const input = Readable.from(["\n", "\n", "\n"]);
      const sink = new Writable({
        write(_chunk, _enc, callback) {
          callback();
        },
      });

      try {
        await add(null, [], { input, output: sink });
      } catch (_) {
        // expected, process.exit is mocked to throw
      }

      exit.restore();
      expect(exit.code()).toBe(1);
    });
  });

  describe("remove", () => {
    beforeEach(() => {
      install();
      saveDb({
        lastId: 2,
        commands: [
          { id: 1, description: "get a file size", tags: ["memory", "file"], createdAt: new Date() },
          { id: 2, description: "check memory", tags: ["memory", "ram"], createdAt: new Date() },
        ],
      });
      writeSnippet(1, "du -h .");
      writeSnippet(2, "free -h");
    });

    test("removes a command by id", async () => {
      await remove(null, ["1"]);

      const db = readDb();
      expect(db.commands.map((c) => c.id)).toEqual([2]);
      expect(fs.existsSync(getSnippetFileName(1))).toBe(false);
    });

    test("removes a command by a q: search when there is a single match", async () => {
      await remove(null, ["q:ram"]);

      const db = readDb();
      expect(db.commands.map((c) => c.id)).toEqual([1]);
      expect(fs.existsSync(getSnippetFileName(2))).toBe(false);
    });

    test("leaves the db untouched when the q: search has no matches", async () => {
      await remove(null, ["q:nonexistent"]);

      const db = readDb();
      expect(db.commands.length).toBe(2);
    });

    test("exits with an error for a non-numeric, non q: target", async () => {
      const exit = captureExit();

      try {
        await remove(null, ["banana"]);
      } catch (_) {
        // expected
      }

      exit.restore();
      expect(exit.code()).toBe(1);
    });

    test("exits with an error for an id that does not exist", async () => {
      const exit = captureExit();

      try {
        await remove(null, ["999"]);
      } catch (_) {
        // expected
      }

      exit.restore();
      expect(exit.code()).toBe(1);
    });

    test("exits with an error when no target is given", async () => {
      const exit = captureExit();

      try {
        await remove(null, []);
      } catch (_) {
        // expected
      }

      exit.restore();
      expect(exit.code()).toBe(1);
    });
  });

  describe("q", () => {
    beforeEach(() => {
      install();
      saveDb({
        lastId: 2,
        commands: [
          { id: 1, description: "get a file size", tags: ["memory", "file"], createdAt: new Date() },
          { id: 2, description: "check memory", tags: ["memory", "ram"], createdAt: new Date() },
        ],
      });
      writeSnippet(1, "du -h .");
      writeSnippet(2, "free -h");
    });

    test("does not throw when there is a single match (auto-copies)", async () => {
      await expect(q(null, ["ram"])).resolves.toBeUndefined();
    });

    test("does not throw when there are no matches", async () => {
      await expect(q(null, ["nonexistent"])).resolves.toBeUndefined();
    });

    test("exits with an error when no term is given", async () => {
      const exit = captureExit();

      try {
        await q(null, []);
      } catch (_) {
        // expected
      }

      exit.restore();
      expect(exit.code()).toBe(1);
    });
  });
});
