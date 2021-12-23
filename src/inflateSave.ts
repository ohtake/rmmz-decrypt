import fsp from "fs/promises";
import pako from "pako"; // RMMZ uses buggy (https://github.com/nodeca/pako/issues/235#issuecomment-898433914) pako v1

let inputFile = "file0.rmmzsave";
let outputFile = "file0.json";

async function main() {
    if (process.argv.length !== 2 + 2) {
        console.log("Usage: node build/inflateSave.js INPUT.rmmzsave OUTPUT.json");
        process.exit(1);
    }
    inputFile = process.argv[2];
    outputFile = process.argv[3];
    console.log("input file (rmmzsave):", inputFile);
    console.log("output file (json):", outputFile);

    const strIn = await fsp.readFile(inputFile, { encoding: "utf8" });
    const jsonStr = pako.inflate(strIn, { to: "string" });
    await fsp.writeFile(outputFile, jsonStr, { encoding: "utf8" });
}

main();
