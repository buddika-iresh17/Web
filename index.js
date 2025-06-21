const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let botProcess = null;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get("/status", (req, res) => {
  res.json({ running: !!botProcess });
});

app.post("/start", (req, res) => {
  if (botProcess) return res.json({ message: "Bot already running" });
  botProcess = spawn("node", ["index.js"], { cwd: "./MANISHA-MD" });
  botProcess.stdout.on("data", (data) => {
    const msg = data.toString();
    if (msg.includes("SCAN")) {
      io.emit("qr", msg); // Simplified, you can extract QR properly here
    }
  });
  botProcess.on("exit", () => {
    botProcess = null;
  });
  res.json({ message: "Bot started" });
});

app.post("/stop", (req, res) => {
  if (botProcess) {
    botProcess.kill();
    botProcess = null;
    res.json({ message: "Bot stopped" });
  } else {
    res.json({ message: "Bot is not running" });
  }
});

app.post("/config", (req, res) => {
  const { session_id, prefix, mode } = req.body;
  const configPath = path.join(__dirname, "./MANISHA-MD/config.js");
  let content = fs.readFileSync(configPath, "utf8");

  content = content.replace(/(session_id\s*[:=]\s*["']).*?(["'])/, `$1${session_id}$2`);
  content = content.replace(/(prefix\s*[:=]\s*["']).*?(["'])/, `$1${prefix}$2`);
  content = content.replace(/(mode\s*[:=]\s*["']).*?(["'])/, `$1${mode}$2`);

  fs.writeFileSync(configPath, content);
  res.json({ message: "Config updated" });
});

io.on("connection", (socket) => {
  console.log("Web client connected");
});

server.listen(3000, () => {
  console.log("Web panel running on http://localhost:3000");
});