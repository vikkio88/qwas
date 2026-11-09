#!/usr/bin/env node

import { argv } from "process";
import { main } from "./src/main.js";

main(argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(1);
});
