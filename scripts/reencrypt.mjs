#!/usr/bin/env node
/**
 * Decrypt or re-encrypt the public portfolio pages.
 *
 * The passkey is read from PORTFOLIO_PASSKEY, or STATICRYPT_PASSWORD, or an
 * interactive prompt. It is never taken from the command line or this file.
 * Run `npm install` once so the staticrypt package is available.
 *
 *   node scripts/reencrypt.mjs decrypt [--out plain]
 *   node scripts/reencrypt.mjs encrypt [plaintext.html ...]
 *
 * encrypt writes index.html, projects.html, and story.html in the repo root.
 * Pass plaintext paths (for example plain/index.html). Already-encrypted
 * public pages are refused so they are not encrypted a second time.
 */

import { createInterface } from "node:readline";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const staticryptRoot = join(root, "node_modules", "staticrypt");
const cryptoEngine = require(join(staticryptRoot, "lib", "cryptoEngine.js"));
const codec = require(join(staticryptRoot, "lib", "codec.js")).init(cryptoEngine);
const { buildStaticryptJS, genFile } = require(join(staticryptRoot, "cli", "helpers.js"));

const PAGES = ["index.html", "projects.html", "story.html"];
const CONFIG = join(root, ".staticrypt.json");
const TEMPLATE = join(root, "scripts", "gate.html");
const MARKER = "staticryptEncryptedMsgUniqueVariableName";

function fail(message) {
    console.error(message);
    process.exit(1);
}

function readPasswordFromPrompt() {
    return new Promise((resolvePassword) => {
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        rl.question("Passkey: ", (answer) => {
            rl.close();
            resolvePassword(answer);
        });
    });
}

async function readPassword() {
    const fromEnv = process.env.PORTFOLIO_PASSKEY || process.env.STATICRYPT_PASSWORD || "";
    if (fromEnv) return fromEnv;
    if (!process.stdin.isTTY) fail("Set PORTFOLIO_PASSKEY in the environment.");
    const answer = (await readPasswordFromPrompt()).trim();
    if (!answer) fail("No passkey entered.");
    return answer;
}

function readSalt() {
    if (!existsSync(CONFIG)) return null;
    const config = JSON.parse(readFileSync(CONFIG, "utf8"));
    if (!config.salt || !/^[0-9a-f]{32}$/.test(config.salt)) fail("Salt in .staticrypt.json must be 32 hex characters.");
    return config.salt;
}

function writeSalt(salt) {
    writeFileSync(CONFIG, JSON.stringify({ salt }, null, 4) + "\n");
}

function parseArgs(argv) {
    const mode = argv[0];
    if (mode !== "encrypt" && mode !== "decrypt") {
        fail("Usage: node scripts/reencrypt.mjs <encrypt|decrypt> [--out dir] [files...]");
    }
    let out = "plain";
    const files = [];
    for (let i = 1; i < argv.length; i++) {
        if (argv[i] === "--out") {
            out = argv[++i];
            if (!out) fail("Missing directory after --out.");
        } else {
            files.push(argv[i]);
        }
    }
    return { mode, out, files };
}

function publicName(file) {
    const name = basename(file);
    if (!PAGES.includes(name)) fail("Only index.html, projects.html, and story.html can be published.");
    return name;
}

async function encrypt(files, password) {
    if (!existsSync(TEMPLATE)) fail("Missing scripts/gate.html.");
    const inputs = (files.length ? files : PAGES).map((file) => resolve(root, file));
    const bodies = inputs.map((file) => {
        if (!existsSync(file)) fail(`Missing plaintext file ${file}`);
        const text = readFileSync(file, "utf8");
        if (text.includes(MARKER)) fail(`${basename(file)} is already encrypted. Decrypt it first, edit that copy, then encrypt the plaintext.`);
        return text;
    });
    let salt = readSalt();
    if (!salt) {
        salt = cryptoEngine.generateRandomSalt();
        writeSalt(salt);
    }
    if (password.length < 14) fail("Refusing a passkey shorter than 14 characters.");
    const hashedPassword = await cryptoEngine.hashPassword(password, salt);
    const baseTemplateData = {
        is_remember_enabled: true,
        js_staticrypt: buildStaticryptJS(),
        staticrypt_config: null,
    };
    for (let i = 0; i < inputs.length; i++) {
        const encryptedMsg = await codec.encodeWithHashedPassword(bodies[i], hashedPassword);
        const outputFilepath = join(root, publicName(inputs[i]));
        genFile(
            {
                ...baseTemplateData,
                staticrypt_config: {
                    staticryptEncryptedMsgUniqueVariableName: encryptedMsg,
                    isRememberEnabled: true,
                    rememberDurationInDays: 0,
                    staticryptSaltUniqueVariableName: salt,
                },
            },
            outputFilepath,
            TEMPLATE
        );
        console.log(`encrypted ${publicName(inputs[i])}`);
    }
}

async function decrypt(files, out, password) {
    const salt = readSalt();
    if (!salt) fail("Missing .staticrypt.json salt. Encrypt once before decrypting.");
    const outputDir = resolve(root, out);
    const rel = relative(root, outputDir);
    const insideRepo = rel === "" || (!rel.startsWith("..") && !rel.startsWith("/"));
    const allowedInside = rel === "plain" || rel === "decrypted" || rel.startsWith("plain/") || rel.startsWith("decrypted/");
    if (insideRepo && !allowedInside) {
        fail("Refusing to decrypt into the published site. Use plain/, decrypted/, or a directory outside the repo.");
    }
    mkdirSync(outputDir, { recursive: true });
    const hashedPassword = await cryptoEngine.hashPassword(password, salt);
    const inputs = (files.length ? files : PAGES).map((file) => resolve(root, file));
    for (const file of inputs) {
        const name = publicName(file);
        const source = existsSync(file) && file.endsWith(name) ? file : join(root, name);
        const encrypted = readFileSync(source, "utf8");
        const cipherText = encrypted.match(/"staticryptEncryptedMsgUniqueVariableName":\s*"([^"]+)"/);
        const saltMatch = encrypted.match(/"staticryptSaltUniqueVariableName":\s*"([^"]+)"/);
        if (!cipherText || !saltMatch) fail(`No encrypted payload in ${name}.`);
        const result = await codec.decode(cipherText[1], hashedPassword, saltMatch[1]);
        if (!result.success) fail(`Could not decrypt ${name}.`);
        writeFileSync(join(outputDir, name), result.decoded);
        console.log(`decrypted ${name}`);
    }
}

const { mode, out, files } = parseArgs(process.argv.slice(2));
const password = await readPassword();
if (mode === "encrypt") await encrypt(files, password);
else await decrypt(files, out, password);
