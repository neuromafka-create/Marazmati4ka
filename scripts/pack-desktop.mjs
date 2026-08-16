import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const payload = path.join(root, "desktop", "payload");
const flavorArg = process.argv.find((a) => a.startsWith("--flavor="))?.slice("--flavor=".length);
const empty = process.argv.includes("--empty") || flavorArg === "skleroznik";
const flavor = empty ? "skleroznik" : flavorArg === "marazmati4ka" ? "marazmati4ka" : "marazmati4ka";
const builderConfig =
  flavor === "skleroznik" ? "desktop/electron-builder-skleroznik.yml" : "desktop/electron-builder.yml";

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32", ...opts });
  if (r.status !== 0) process.exit(r.status || 1);
}

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, name.name);
    const to = path.join(dest, name.name);
    if (name.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function findStandaloneRoot(dir) {
  if (fs.existsSync(path.join(dir, "server.js"))) return dir;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const found = findStandaloneRoot(path.join(dir, name.name));
    if (found) return found;
  }
  return null;
}

const appDir = path.join(payload, "app");
const reuse = process.argv.includes("--reuse") && fs.existsSync(path.join(appDir, "server.js"));
if (reuse) {
  console.log("1/4  reuse desktop/payload/app");
} else {
  console.log("1/4  next build");
  run("npx", ["next", "build"]);

  const standalone = findStandaloneRoot(path.join(root, ".next", "standalone"));
  if (!standalone) {
    console.error("Не найден .next/standalone/server.js");
    process.exit(1);
  }

  rmrf(payload);
  copyDir(standalone, appDir);
  copyDir(path.join(root, ".next", "static"), path.join(appDir, ".next", "static"));
  if (fs.existsSync(path.join(root, "public"))) {
    copyDir(path.join(root, "public"), path.join(appDir, "public"));
  }
}

console.log("2/4  runtime Node + данные");
const runtime = path.join(payload, "runtime");
fs.mkdirSync(runtime, { recursive: true });
const nodeSrc = process.execPath;
if (!/node(\.exe)?$/i.test(nodeSrc)) {
  console.error("Сборку запускайте через Node, не через Electron:", nodeSrc);
  process.exit(1);
}
fs.copyFileSync(nodeSrc, path.join(runtime, "node.exe"));

if (flavor === "skleroznik") {
  console.log("   пустой Склерозник: без docs и без вашей базы");
} else {
  copyDir(path.join(root, "docs"), path.join(payload, "docs"));
  const seed = path.join(payload, "seed");
  fs.mkdirSync(seed, { recursive: true });
  const db = path.join(root, "data", "notebook.db");
  if (fs.existsSync(db)) {
    fs.copyFileSync(db, path.join(seed, "notebook.db"));
    copyDir(path.join(root, "data", "media"), path.join(seed, "media"));
    console.log("   seed: текущая база и media");
  } else {
    fs.writeFileSync(path.join(seed, ".keep"), "");
  }
}

console.log("3/4  electron-builder", builderConfig);
run("npx", ["electron-builder", "--win", "nsis", "--config", builderConfig]);

console.log("4/4  готово");
const nextPacked = path.join(root, "dist-desktop", "win-unpacked", "resources", "notebook", "node_modules", "next");
if (!fs.existsSync(nextPacked)) {
  console.error("Проверка не прошла: в установке нет notebook/node_modules/next");
  process.exit(1);
}
const out = path.join(root, "dist-desktop");
if (fs.existsSync(out)) {
  for (const name of fs.readdirSync(out)) {
    if (name.toLowerCase().endsWith(".exe") && name.includes("Setup")) {
      const abs = path.join(out, name);
      const mb = (fs.statSync(abs).size / 1024 / 1024).toFixed(1);
      console.log(`Установщик: ${abs} (${mb} МБ)`);
    }
  }
}
