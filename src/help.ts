import { col, getConfigDir, l } from "./helpers.js";

export function printHelp() {
  l(`
    ${col.b(col.cg("qwas"))}

    ${col.i("Help")}
    a small cli utility to save/search command snippets with a description and tags.
    ${col.b("source")}: https://github.com/vikkio88/qwas

    ${col.b("Actions:")}

    ${col.b(". qwas install")}
        Creates the ${col.b(getConfigDir())} folder (db + snippets) used to store your commands.
        Seeds it with a few example commands (disk size, free space, ffmpeg, imagemagick).
        Safe to run multiple times.

    ${col.b(". qwas add [command] [description] [tags]")}
        Saves a new command.
        "qwas add" without arguments will prompt you for command, description and tags.
        "qwas add \\"du -h .\\" \\"get a file size\\" \\"memory,file,size\\"" saves it directly.
        tags are a comma separated list.

    ${col.b(". qwas q <term>")}
        alias: search
        Searches your saved commands by description and tags.
        "qwas q memory, file, size" matches any command whose description or tags
        contain any of those words.
        "qwas q t:memory,file" (prefix with "t:") searches tags only.
        If there is a single match it is copied to your clipboard right away,
        otherwise you get a numbered list and can type "> N" to copy that command.

    ${col.b(". qwas remove <id|q:term>")}
        alias: rm
        Removes a saved command by id ("qwas remove 3"),
        or by searching first ("qwas remove q:memory") which lists matches and
        lets you pick which one to delete (same flow as "qwas q").

    ${col.b(". qwas list")}
        alias: l, ls
        Lists all your saved commands with their id, description, tags and snippet.

    ${col.b(". qwas h")}
        alias: help, -h, --help
        Will print this help.

    ${col.b(". qwas v")}
        alias: version, --v, --version
        Will print the version.

    All commands and the db are stored in ${col.b(getConfigDir())}.
    `);
}
