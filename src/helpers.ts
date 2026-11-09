import clipboard from "clipboardy";
import fs from "fs";
import os from "os";
import path from "path";
import process from "process";
import readline from "readline/promises";
import picocolors from "picocolors";
import { CONF_DIRNAME, DB_FILENAME, SNIPPETS_DIRNAME } from "./conf.js";
import { SEED_COMMANDS } from "./seed.js";

export function getConfigDir(): string {
  return path.join(process.env.HOME || os.homedir(), CONF_DIRNAME);
}

export function getDbFileName(): string {
  return path.join(getConfigDir(), DB_FILENAME);
}

export function getSnippetsDir(): string {
  return path.join(getConfigDir(), SNIPPETS_DIRNAME);
}

export function getSnippetFileName(id: number): string {
  return path.join(getSnippetsDir(), `${id}.sh`);
}

export function isInstalled(): boolean {
  return fs.existsSync(getDbFileName());
}

export function install(): boolean {
  const alreadyInstalled = isInstalled();

  if (!fs.existsSync(getConfigDir())) {
    fs.mkdirSync(getConfigDir(), { recursive: true });
  }
  if (!fs.existsSync(getSnippetsDir())) {
    fs.mkdirSync(getSnippetsDir(), { recursive: true });
  }
  if (!alreadyInstalled) {
    seedDb();
  }

  return !alreadyInstalled;
}

function seedDb() {
  const db: Db = { lastId: 0, commands: [] };

  for (const { command, description, tags } of SEED_COMMANDS) {
    const id = db.lastId + 1;
    db.commands.push({ id, description, tags, createdAt: new Date() });
    db.lastId = id;
    writeSnippet(id, command);
  }

  saveDb(db);
}

export function readDb(): Db {
  const data = fs.readFileSync(getDbFileName());
  try {
    return JSON.parse(data.toString());
  } catch {
    console.error(`Cannot parse ${getDbFileName()} correctly.`);
    process.exit(1);
  }
}

export function saveDb(db: Db) {
  fs.writeFileSync(getDbFileName(), JSON.stringify(db, null, 2));
}

export function readSnippet(id: number): string {
  return fs.readFileSync(getSnippetFileName(id)).toString();
}

export function writeSnippet(id: number, command: string) {
  fs.writeFileSync(getSnippetFileName(id), command);
}

export function removeSnippet(id: number) {
  const file = getSnippetFileName(id);
  if (fs.existsSync(file)) fs.rmSync(file);
}

export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim().toLocaleLowerCase())
    .filter(Boolean);
}

const TAG_QUERY_PREFIX = "t:";

export function isTagQuery(query: string): boolean {
  return Boolean(query) && query.startsWith(TAG_QUERY_PREFIX);
}

export function parseQuery(query: string): { terms: string[]; tagsOnly: boolean } {
  if (isTagQuery(query)) {
    return { terms: parseTags(query.slice(TAG_QUERY_PREFIX.length)), tagsOnly: true };
  }

  return {
    terms: query
      .split(/[,\s]+/)
      .map((t) => t.trim().toLocaleLowerCase())
      .filter(Boolean),
    tagsOnly: false,
  };
}

export function searchCommands(db: Db, query: string): Command[] {
  const { terms, tagsOnly } = parseQuery(query);
  if (terms.length < 1) return [];

  return db.commands.filter((c) => {
    const tags = c.tags.map((t) => t.toLocaleLowerCase());
    if (tagsOnly) {
      return terms.some((term) => tags.includes(term));
    }

    const haystack = `${c.description.toLocaleLowerCase()} ${tags.join(" ")}`;
    return terms.some((term) => haystack.includes(term));
  });
}

export function findById(db: Db, id: number): Command | null {
  return db.commands.find((c) => c.id === id) ?? null;
}

export async function promptForChoice(
  matches: Command[],
  input: NodeJS.ReadableStream = process.stdin,
  output: NodeJS.WritableStream = process.stderr,
): Promise<Command | null> {
  const answer = (await readLineSync("> ", input, output)).trim();
  const choice = Number(answer);

  if (!Number.isInteger(choice)) {
    l(`${col.cr("Error:")} invalid choice "${answer}".`);
    return null;
  }

  const match = matches.find((c) => c.id === choice);
  if (!match) {
    l(`${col.cr("Error:")} no command with id "${choice}" in the results.`);
    return null;
  }

  return match;
}

export async function promptLines(
  prompts: string[],
  input: NodeJS.ReadableStream = process.stdin,
  output: NodeJS.WritableStream = process.stderr,
): Promise<string[]> {
  // Deliberately not built on rl.question() x N: when all the input is already
  // buffered (e.g. piped in at once), the stream's "end" can fire between
  // questions and readline auto-closes itself, breaking later question()
  // calls with ERR_USE_AFTER_CLOSE. Driving everything off a single "line"
  // listener avoids that race.
  const rl = readline.createInterface({ input, output });
  const answers: string[] = [];

  return new Promise((resolve) => {
    const askNext = () => {
      if (answers.length >= prompts.length) {
        rl.close();
        resolve(answers);
        return;
      }
      output.write(prompts[answers.length]);
    };

    rl.on("line", (line) => {
      answers.push(line);
      askNext();
    });

    rl.on("close", () => {
      while (answers.length < prompts.length) answers.push("");
      resolve(answers);
    });

    askNext();
  });
}

export async function readLineSync(
  promptText: string,
  input: NodeJS.ReadableStream = process.stdin,
  output: NodeJS.WritableStream = process.stderr,
): Promise<string> {
  const rl = readline.createInterface({ input, output });
  try {
    return await rl.question(promptText);
  } finally {
    rl.close();
  }
}

export function copyToClipboard(command: string) {
  try {
    clipboard.writeSync(command);
    l(`\n${col.i("copied to clipboard!")}`);
  } catch (_) {
    l(`${col.cr("Error:")} could not copy to clipboard.`);
  }
}

export function printCommand(c: Command, command: string) {
  l(`${col.b(String(c.id))} - ${col.cg(c.description)}`);
  if (c.tags.length > 0) {
    l(`\t${col.i("tags")}: ${c.tags.join(", ")}`);
  }
  l(`\t${command}\n`);
}

export function l(message: string) {
  console.error(message);
}

export const col = {
  cg: picocolors.green,
  cr: picocolors.red,
  b: picocolors.bold,
  i: picocolors.italic,
};
