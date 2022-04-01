const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const MiniSearch = require('minisearch');

const argv = yargs(hideBin(process.argv)).argv;
let pckgs = {};
try {
    pckgs = require(`${process.cwd()}/package.json`);
} catch (error) {
    console.error('No package.json in current directory');
    process.exit(1);
}

function parseScripts(scripts) {
    const parsed = [];
    for (const index in Object.keys(scripts)) {
        const name = Object.keys(scripts)[index];
        const cmd = scripts[name];
        parsed.push({ id: index, name, cmd });
    }
    return parsed;
}


function main(argv, package) {
    const hasTarget = argv._.length > 0;
    const target = (hasTarget) ? argv._[0] : null;
    const isSearching = Boolean(argv.s || argv.search);
    const { scripts } = package;
    const parsedScripts = parseScripts(scripts);

    if (argv.l || argv.list) {
        list(parsedScripts);
        process.exit(0);
    }

    if (isSearching) {
        search(parsedScripts, argv.s || argv.search);
        process.exit(0);
    }

    if (hasTarget && !isSearching) {
        const index = target;
        printCmdAtIndex(scripts, index);
        process.exit(0);
    }

    // If no other 
    console.error('nah-ah');
    process.exit(1);
}

function search(scripts, searchValue) {
    let miniSearch = new MiniSearch({
        fields: ['name', 'cmd'],
        storeFields: ['name', 'cmd']
    });

    miniSearch.addAll(scripts);
    const results = miniSearch.search(searchValue, { fuzzy: .3 });
    list(results);
}

function printCmdAtIndex(scripts, index) {
    if (Object.keys(scripts).length <= index) {
        console.error(`${index} is not a valid index`);
        process.exit(1);
    }
    const script = Object.keys(scripts)[index];
    console.log(`\t${scripts[script]}`);
    console.log(``);
    console.log(`npm run ${script}`);
    console.log(``);
}

function list(scripts) {
    console.log(`------------`);
    if (scripts.length < 1) {
        console.log('Nope');
        return;
    }

    for (const { id, name, cmd } of scripts) {
        console.log(`[${id}]: ${name}`);
        console.log(`\t command: ${cmd}`);
        console.log(``);
        console.log(`\t npm run ${name}`);
        console.log(``);
    }
}


main(argv, pckgs);
