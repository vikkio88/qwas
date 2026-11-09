import { printHelp } from "./help.js";
import { isInstalled, install as installDirs, l, col } from "./helpers.js";
import { list, q, add, remove, version, install } from "./methods.js";

const METHODS = {
  LIST: {
    func: list,
  },
  SEARCH: {
    func: q,
  },
  ADD: {
    func: add,
  },
  REMOVE: {
    func: remove,
  },
  HELP: {
    func: printHelp,
  },
  VERSION: {
    func: version,
  },
  INSTALL: {
    func: install,
  },
};

const VALID_ARGS = {
  l: METHODS.LIST,
  list: METHODS.LIST,
  ls: METHODS.LIST,
  q: METHODS.SEARCH,
  search: METHODS.SEARCH,
  add: METHODS.ADD,
  remove: METHODS.REMOVE,
  rm: METHODS.REMOVE,
  help: METHODS.HELP,
  "-h": METHODS.HELP,
  "--help": METHODS.HELP,
  h: METHODS.HELP,
  v: METHODS.VERSION,
  "-v": METHODS.VERSION,
  "--version": METHODS.VERSION,
  version: METHODS.VERSION,
  install: METHODS.INSTALL,
};

export async function main(args: string[]) {
  if (args[0] === "install") {
    install();
    return;
  }

  if (Array.isArray(args) && args.length < 1) {
    printHelp();
    return;
  }

  if (!Object.keys(VALID_ARGS).includes(args[0])) {
    printHelp();
    return;
  }

  if (!isInstalled()) {
    l(`${col.i("first run, installing qwas...")}`);
    installDirs();
  }

  const method = VALID_ARGS[args[0]];
  if (Boolean(method)) {
    await method.func(null, args.slice(1));
    process.exit(0);
  }

  printHelp();
}
