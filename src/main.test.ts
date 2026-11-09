import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import { getConfigDir } from "./helpers.js";
import { main } from "./main.js";

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

describe("main", () => {
  const originalHome = process.env.HOME;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "qwas-main-"));
    process.env.HOME = tmpDir;
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("with no args prints help and does not exit", async () => {
    await expect(main([])).resolves.toBeUndefined();
  });

  test("with an unknown command prints help and does not exit", async () => {
    await expect(main(["banana"])).resolves.toBeUndefined();
  });

  test("routes 'install' and creates the config dir", async () => {
    const exit = captureExit();
    try {
      await main(["install"]);
    } catch (_) {
      // install() itself doesn't call process.exit, but keep this resilient
    }
    exit.restore();
    expect(fs.existsSync(getConfigDir())).toBe(true);
  });

  test("auto-installs on first run of a valid command", async () => {
    const exit = captureExit();
    try {
      await main(["list"]);
    } catch (_) {
      // process.exit(0) is called on success and mocked to throw
    }
    exit.restore();
    expect(fs.existsSync(getConfigDir())).toBe(true);
    expect(exit.code()).toBe(0);
  });

  test("'version' exits with code 0", async () => {
    const exit = captureExit();
    try {
      await main(["version"]);
    } catch (_) {
      // expected
    }
    exit.restore();
    expect(exit.code()).toBe(0);
  });

  test("'v' and '--version' are aliases of 'version'", async () => {
    for (const alias of ["v", "--version"]) {
      const exit = captureExit();
      try {
        await main([alias]);
      } catch (_) {
        // expected
      }
      exit.restore();
      expect(exit.code()).toBe(0);
    }
  });

  test("'help', 'h', '-h', '--help' all resolve without exiting non-zero", async () => {
    for (const alias of ["help", "h", "-h", "--help"]) {
      const exit = captureExit();
      try {
        await main([alias]);
      } catch (_) {
        // expected
      }
      exit.restore();
      expect(exit.code()).toBe(0);
    }
  });

  test("'l', 'list' and 'ls' are aliases", async () => {
    for (const alias of ["l", "list", "ls"]) {
      const exit = captureExit();
      try {
        await main([alias]);
      } catch (_) {
        // expected
      }
      exit.restore();
      expect(exit.code()).toBe(0);
    }
  });
});
