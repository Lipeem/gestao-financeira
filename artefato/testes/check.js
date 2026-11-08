const fs = require("fs");
const path = process.argv[2];
const html = fs.readFileSync(path, "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
const js = m[1];
fs.writeFileSync(path.replace(/\.html$/, "") + ".extracted.js", js);

// data-act values (static)
const acts = new Set([...js.matchAll(/data-act="([a-zA-Z]+)"/g)].map(x => x[1]));
const actKeys = new Set([...js.matchAll(/^\s{2}([a-zA-Z]+):\s*(?:async\s*)?(?:\(|[a-z]\s*=>)/gm)].map(x => x[1]));
const semHandler = [...acts].filter(a => !actKeys.has(a));
console.log("data-act sem handler:", semHandler);
console.log("handlers sem uso:", [...actKeys].filter(a => !acts.has(a)));

// ids via getElementById (static literals)
const used = new Set([...js.matchAll(/getElementById\("([^"]+)"\)/g)].map(x => x[1]));
const htmlIds = new Set([...html.matchAll(/\bid="([^"$]+)"/g)].map(x => x[1]));
const dynIds = [...html.matchAll(/\bid="([^"]*\$\{[^"]*)"/g)].map(x => x[1]);
const semId = [...used].filter(i => !htmlIds.has(i));
console.log("ids usados sem id= estático:", semId);
console.log("ids dinâmicos:", dynIds);

// dataset fields read
const dsRead = new Set([...js.matchAll(/dataset\.([a-zA-Z]+)/g)].map(x => x[1]));
const dsWritten = new Set([...js.matchAll(/data-([a-z]+)=/g)].map(x => x[1]));
console.log("dataset lidos sem data-* escrito:", [...dsRead].filter(d => !dsWritten.has(d)));

// botão sem ação ou campo inexistente fazem o comando falhar (usado na verificação automática do GitHub)
if (semHandler.length || semId.length) process.exitCode = 1;
