import {
  col,
  copyToClipboard,
  findById,
  getConfigDir,
  install as installDirs,
  l,
  parseTags,
  printCommand,
  promptForChoice,
  promptLines,
  readDb,
  readSnippet,
  removeSnippet,
  saveDb,
  searchCommands,
  writeSnippet,
} from "./helpers.js";
import v from "./version.cjs";

export function version() {
  l(`${col.b("qwas")}\n\tversion: ${v()}`);
}

export function install() {
  const created = installDirs();
  if (!created) {
    l(`${col.cg("Already installed")} in "${col.b(getConfigDir())}", nothing to do.`);
    return;
  }

  l(`${col.cg("Installed")} qwas in "${col.b(getConfigDir())}".\nRun ${col.b("qwas add")} to save your first command.`);
}

export function list() {
  const db = readDb();
  if (db.commands.length < 1) {
    l("No commands saved yet, add one with `qwas add`.");
    return;
  }

  l(`${col.b("Commands")} in ${col.b(getConfigDir())}/:\n`);
  for (const c of db.commands) {
    printCommand(c, readSnippet(c.id));
  }
}

export async function q(_config: null, [rawTerm, ...rest]: string[]) {
  const term = [rawTerm, ...rest].filter(Boolean).join(" ");
  if (!term) {
    l(`${col.cr("Error:")} no search term specified.`);
    process.exit(1);
  }

  const db = readDb();
  const matches = searchCommands(db, term);

  if (matches.length < 1) {
    l(`No commands found matching "${col.b(term)}".`);
    return;
  }

  l(`${col.b("Results")} for "${col.b(term)}":\n`);
  for (const c of matches) {
    printCommand(c, readSnippet(c.id));
  }

  if (matches.length === 1) {
    copyToClipboard(readSnippet(matches[0].id));
    return;
  }

  const choice = await promptForChoice(matches);
  if (!choice) {
    process.exit(1);
  }

  copyToClipboard(readSnippet(choice.id));
}

export async function add(
  _config: null,
  [command, description, tags]: string[],
  io: { input?: NodeJS.ReadableStream; output?: NodeJS.WritableStream } = {},
) {
  let cmd = command;
  let desc = description;
  let tagList = tags;

  if (!cmd) {
    [cmd, desc, tagList] = await promptLines(
      ["command: ", "description: ", "tags (comma separated): "],
      io.input,
      io.output,
    );
  }

  if (!cmd) {
    l(`${col.cr("Error:")} command cannot be empty.`);
    process.exit(1);
  }

  const db = readDb();
  const id = db.lastId + 1;
  const newCommand: Command = {
    id,
    description: desc ?? "",
    tags: parseTags(tagList ?? ""),
    createdAt: new Date(),
  };

  db.commands.push(newCommand);
  db.lastId = id;
  saveDb(db);
  writeSnippet(id, cmd);

  l(`${col.cg("Added")} command ${col.b(String(id))}.`);
  printCommand(newCommand, cmd);
}

export async function remove(_config: null, [target]: string[]) {
  if (!target) {
    l(`${col.cr("Error:")} specify an id or a "q:term" search.`);
    process.exit(1);
  }

  const db = readDb();

  if (target.startsWith("q:")) {
    const term = target.slice(2);
    const matches = searchCommands(db, term);

    if (matches.length < 1) {
      l(`No commands found matching "${col.b(term)}".`);
      return;
    }

    l(`${col.b("Results")} for "${col.b(term)}":\n`);
    for (const c of matches) {
      printCommand(c, readSnippet(c.id));
    }

    const choice = matches.length === 1 ? matches[0] : await promptForChoice(matches);
    if (!choice) {
      process.exit(1);
    }

    removeCommand(db, choice.id);
    return;
  }

  const id = Number(target);
  if (!Number.isInteger(id)) {
    l(`${col.cr("Error:")} "${target}" is not a valid id.`);
    process.exit(1);
  }

  const command = findById(db, id);
  if (!command) {
    l(`${col.cr("Error:")} no command with id "${id}".`);
    process.exit(1);
  }

  removeCommand(db, id);
}

function removeCommand(db: Db, id: number) {
  db.commands = db.commands.filter((c) => c.id !== id);
  saveDb(db);
  removeSnippet(id);
  l(`${col.cg("Removed")} command ${col.b(String(id))}.`);
}
