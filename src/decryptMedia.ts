import fsp from "fs/promises";
import path from "path";

let inputDir = "dummy_input";
let outputDir = "dummy_output";
let key: string = "00112233445566778899aabbccddeeff";

async function loadEncryptionKey() {
    const str = await fsp.readFile(path.join(inputDir, "data", "System.json"), { encoding: "utf-8" });
    const data = JSON.parse(str);
    const encryptionKey = data.encryptionKey;
    if (typeof encryptionKey !== "string") {
        throw new Error("cannot find encryption key");
    }
    key = encryptionKey;
}

function decryptArrayBuffer(source: ArrayBuffer) {
    const header = new Uint8Array(source, 0, 16);
    const headerHex = Array.from(header, x => x.toString(16)).join(",");
    if (headerHex !== "52,50,47,4d,56,0,0,0,0,3,1,0,0,0,0,0") {
        throw new Error(`Unknown header ${headerHex}`)
    }
    const body = source.slice(16);
    const view = new DataView(body);
    const keys = key.match(/.{2}/g)!;
    for (let i = 0; i < 16; i++) {
        view.setUint8(i, view.getUint8(i) ^ parseInt(keys[i], 16));
    }
    return body;
}

async function prepareDir(p: string) {
    const dir = path.parse(path.resolve(p)).dir;
    await fsp.mkdir(dir, { recursive: true });
}

async function decryptFile(file: string) {
    const source = await fsp.readFile(path.join(inputDir, file + "_"));
    const decryptedBody = decryptArrayBuffer(source.buffer);
    await prepareDir(path.join(outputDir, file));
    await fsp.writeFile(path.join(outputDir, file), Buffer.from(decryptedBody));
}

async function* listFiles(dir: string): AsyncGenerator<string> {
    const children = await fsp.readdir(path.join(inputDir, dir));
    for (const child of children) {
        const stat = await fsp.stat(path.join(inputDir, dir, child));
        if (stat.isDirectory()) {
            yield* listFiles(path.join(dir, child));
        } else if (stat.isFile()) {
            if (child.endsWith("_")) {
                yield path.join(dir, child.substring(0, child.length - 1));
            }
        }
    }
}

async function runDecryption(dir: "audio" | "img") {
    let count = 0;
    for await (const f of listFiles(dir)) {
        process.stdout.write(`decrypting: ${f}`);
        await decryptFile(f)
        process.stdout.clearLine(-1);
        process.stdout.cursorTo(0);
        count++;
    }
    return count;
}

async function main() {
    if (process.argv.length !== 2 + 2) {
        console.log("Usage: node build/decryptMedia.js INPUT OUTPUT");
        process.exit(1);
    }
    inputDir = process.argv[2];
    outputDir = process.argv[3];
    console.log("input dir:", inputDir);
    console.log("output dir:", outputDir);

    await loadEncryptionKey();
    console.log("encryption key:", key);
    const audioCount = await runDecryption("audio");
    console.log(`Decrypted ${audioCount} audio files`);
    const imgCoung = await runDecryption("img");
    console.log(`Decrypted ${imgCoung} image files`);
}

main();
