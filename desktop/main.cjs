const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const isDev = !app.isPackaged;
let child = null;
let win = null;
let shuttingDown = false;

function loadFlavor() {
  const file = isDev
    ? path.join(__dirname, "flavors", "marazmati4ka.json")
    : path.join(process.resourcesPath, "flavor.json");
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return { id: "marazmati4ka", name: "Marazmati4ka", nameEn: "Marazmati4ka", tag: "блокнот", empty: false, port: 3005 };
  }
}

const flavor = loadFlavor();
if (flavor.id === "skleroznik") {
  app.setName("Skleroznik");
  app.setPath("userData", path.join(app.getPath("appData"), "Skleroznik"));
}

function userRoot() {
  return path.join(app.getPath("userData"), "notebook");
}

function bundledRoot() {
  return isDev ? path.join(__dirname, "..") : process.resourcesPath;
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, name.name);
    const to = path.join(dest, name.name);
    if (name.isDirectory()) copyDirSync(from, to);
    else if (!fs.existsSync(to)) fs.copyFileSync(from, to);
  }
}

function ensureUserTree() {
  const root = userRoot();
  const docs = path.join(root, "docs");
  const data = path.join(root, "data");
  fs.mkdirSync(data, { recursive: true });
  fs.mkdirSync(path.join(root, "_trash"), { recursive: true });
  fs.mkdirSync(docs, { recursive: true });
  if (!flavor.empty) {
    const bundle = bundledRoot();
    const bundledDocs = path.join(bundle, "docs");
    if (fs.readdirSync(docs).length === 0) {
      copyDirSync(bundledDocs, docs);
    }
    const seedDir = isDev ? path.join(bundle, "data") : path.join(bundle, "seed");
    const seedDb = path.join(seedDir, "notebook.db");
    const userDb = path.join(data, "notebook.db");
    if (!fs.existsSync(userDb) && fs.existsSync(seedDb)) {
      fs.copyFileSync(seedDb, userDb);
      copyDirSync(path.join(seedDir, "media"), path.join(data, "media"));
    }
  }
  return root;
}

function freePort(start) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      if (port > start + 30) {
        reject(new Error("Нет свободного порта"));
        return;
      }
      const server = net.createServer();
      server.unref();
      server.on("error", () => tryPort(port + 1));
      server.listen(port, "127.0.0.1", () => {
        server.close(() => resolve(port));
      });
    };
    tryPort(start);
  });
}

function waitHttp(url, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status === 404) {
          resolve();
          return;
        }
      } catch {
        /* still booting */
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error("Сервер блокнота не ответил"));
        return;
      }
      setTimeout(tick, 400);
    };
    tick();
  });
}

function logFile() {
  return path.join(app.getPath("userData"), "server.log");
}

function appendLog(text) {
  try {
    fs.appendFileSync(logFile(), text);
  } catch {
    /* ignore */
  }
}

function lastLog(max = 1800) {
  try {
    const text = fs.readFileSync(logFile(), "utf8");
    return text.slice(-max);
  } catch {
    return "";
  }
}

function nodeBinary() {
  if (isDev) return process.execPath.includes("electron") ? "node" : process.execPath;
  return path.join(process.resourcesPath, "runtime", "node.exe");
}

function serverCwd() {
  if (isDev) return path.join(__dirname, "..");
  return path.join(process.resourcesPath, "notebook");
}

function startServer(port, root) {
  shuttingDown = false;
  const cwd = serverCwd();
  const node = nodeBinary();
  const args = isDev
    ? ["node_modules/next/dist/bin/next", "start", "--port", String(port), "--hostname", "127.0.0.1"]
    : ["server.js"];
  const env = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    MARAZ_ROOT: root,
    MARAZ_FLAVOR: flavor.id || "marazmati4ka",
    NODE_ENV: "production",
  };
  try {
    fs.writeFileSync(
      logFile(),
      `start ${new Date().toISOString()}\nnode=${node}\ncwd=${cwd}\nargs=${args.join(" ")}\nroot=${root}\n`
    );
  } catch {
    /* ignore */
  }
  if (!isDev && !fs.existsSync(path.join(cwd, "server.js"))) {
    throw new Error(`Не найден сервер: ${path.join(cwd, "server.js")}`);
  }
  if (!isDev && !fs.existsSync(path.join(cwd, "node_modules", "next"))) {
    throw new Error("В установке нет Next.js (node_modules). Переустановите свежей сборкой.");
  }
  child = spawn(node, args, {
    cwd,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (buf) => {
    process.stdout.write(buf);
    appendLog(buf.toString());
  });
  child.stderr?.on("data", (buf) => {
    process.stderr.write(buf);
    appendLog(buf.toString());
  });
  child.on("exit", (code) => {
    appendLog(`\nexit ${code}\n`);
    if (shuttingDown) return;
    if (win && !win.isDestroyed() && code && code !== 0) {
      const tail = lastLog();
      dialog.showErrorBox(
        flavor.name,
        `Сервер блокнота завершился (${code}).\n\n${tail || "Подробности: " + logFile()}`
      );
    }
  });
}

function preferredPort() {
  const n = Number(flavor.port);
  return Number.isFinite(n) && n > 0 ? n : flavor.id === "skleroznik" ? 3007 : 3005;
}

function stopServer() {
  shuttingDown = true;
  if (!child || child.killed) return;
  const pid = child.pid;
  child = null;
  if (process.platform === "win32" && pid) {
    spawn("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
  } else if (pid) {
    try {
      process.kill(pid);
    } catch {
      /* already gone */
    }
  }
}

function buildMenu(root) {
  const template = [
    {
      label: "Файл",
      submenu: [
        {
          label: "Папка данных",
          click: () => shell.openPath(root),
        },
        { type: "separator" },
        { role: "quit", label: "Выход" },
      ],
    },
    {
      label: "Правка",
      submenu: [
        { role: "undo", label: "Отменить" },
        { role: "redo", label: "Повторить" },
        { type: "separator" },
        { role: "cut", label: "Вырезать" },
        { role: "copy", label: "Копировать" },
        { role: "paste", label: "Вставить" },
        { role: "selectAll", label: "Выделить всё" },
      ],
    },
    {
      label: "Вид",
      submenu: [
        { role: "reload", label: "Обновить" },
        { role: "togglefullscreen", label: "Полный экран" },
        { type: "separator" },
        { role: "zoomIn", label: "Крупнее" },
        { role: "zoomOut", label: "Мельче" },
        { role: "resetZoom", label: "Сбросить масштаб" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function splashHtml() {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
<html><body style="margin:0;background:#141416;color:#c4c0b6;font-family:Georgia,serif;height:100vh;display:grid;place-items:center;text-align:center">
<div>
  <div style="font-size:28px;letter-spacing:.04em">${flavor.name}</div>
  <div style="margin-top:10px;font-size:14px;opacity:.65">Запускаю блокнот…</div>
</div>
</body></html>`)}`;
}

async function createWindow() {
  const root = ensureUserTree();
  buildMenu(root);
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 880,
    minHeight: 600,
    backgroundColor: "#141416",
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      sandbox: true,
    },
  });
  win.once("ready-to-show", () => win.show());
  await win.loadURL(splashHtml());

  try {
    const port = await freePort(preferredPort());
    startServer(port, root);
    await waitHttp(`http://127.0.0.1:${port}/`, 90000);
    if (!win.isDestroyed()) await win.loadURL(`http://127.0.0.1:${port}/`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    dialog.showErrorBox(flavor.name, message);
    app.quit();
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
  app.whenReady().then(createWindow);
  app.on("before-quit", stopServer);
  app.on("window-all-closed", () => {
    stopServer();
    app.quit();
  });
}
