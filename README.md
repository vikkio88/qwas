# qwas
a useless cli script to print info about packages.json

```
npm i -g qwas
```

## Examples

if you have a `scripts` section in the `package.json` like this:
```json
"scripts": {
    "debug": "npm run dev",
    "stuff:things": "npx do thing",
    "deploy:prod": "node somescript.js"
},
```

### List
```
qwas -l 
// or
qwas --list
```

will print

```
------------
[0]: debug
         command: npm run dev

         npm run debug

[1]: stuff:things
         command: npx do thing

         npm run stuff:things

[2]: deploy:prod
         command: node somescript.js

         npm run deploy:prod
```

### Search
```
qwas -s depl
// or
qwas --search dploy
```

will print
```
------------
[2]: deploy:prod
         command: node somescript.js

         npm run deploy:prod
```

### Select by Index
```
qwas 1
```

will print
```
        npx do thing

npm run stuff:things
```
so you can copy paste it.
