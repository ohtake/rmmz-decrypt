import fsp from "fs/promises";
import pako from "pako"; // RMMZ uses buggy (https://github.com/nodeca/pako/issues/235#issuecomment-898433914) pako v1

let inputFile = "file0.json";
let outputFile = "file0.rmmzsave";

async function main() {
    if (process.argv.length !== 2 + 2) {
        console.log("Usage: node build/deflateSave.js INPUT.json OUTPUT.rmmzsave");
        process.exit(1);
    }
    inputFile = process.argv[2];
    outputFile = process.argv[3];
    console.log("input file (json):", inputFile);
    console.log("output file (rmmzsave):", outputFile);

    const jsonStr = await fsp.readFile(inputFile, { encoding: "utf8" });
    const zipStr = pako.deflate(jsonStr, { to: "string", level: 1 });
    await fsp.writeFile(outputFile, zipStr, { encoding: "utf8" });
}

main();
