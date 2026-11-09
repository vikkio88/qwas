# qwas

A cli command-note tool. Save shell one-liners with a description and tags in `~/.qwas/`, then find them again in seconds and copy them to your clipboard.

```
npm i -g qwas
```

Install (creates `~/.qwas/`, safe to run again):
```
qwas install
```
It seeds a few example commands to get you started (disk size, free space on a mounted drive, ffmpeg compression/conversion, imagemagick resize/convert), so you can run `qwas list` or `qwas q ffmpeg` right away.

## Add a command
```
qwas add "du -h ." "get a file size" "memory,file,size"
```

or just run `qwas add` with no arguments and it will prompt you for the command, description and tags.

## List everything
```
qwas list
```

## Search
```
qwas q "memory, file, size"
```
```
Results for "memory, file, size":

1 - get a file size
	tags: memory, file, size
	du -h .
```
If there is a single match it is copied to your clipboard right away. If there are several, you'll get a numbered list and a prompt:
```
> 1
```
and the matching command is copied to your clipboard, ready for `CTRL+V`.

You can also search tags only by prefixing the query with `t:`:
```
qwas q t:memory,file
```

## Remove
```
qwas remove 1
```
or search first and pick from the list:
```
qwas remove q:memory
```

## Other commands
```
qwas list     # alias: l, ls
qwas help     # alias: h, -h, --help
qwas version  # alias: v, --version
```

Everything is stored in `~/.qwas/`:
- `db.json` - the index of commands (id, description, tags)
- `snippets/<id>.sh` - the raw command text for each entry
