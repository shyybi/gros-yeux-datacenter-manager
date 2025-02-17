const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

const isDev = !app.isPackaged;
const dbPath = isDev ? path.join(__dirname, 'servers.db') : path.join(app.getPath('userData'), 'servers.db');
const db = new Database(dbPath);

db.prepare(`
  CREATE TABLE IF NOT EXISTS servers (
    ip TEXT PRIMARY KEY,
    name TEXT,
    port TEXT
  )
`).run();

function addServer(server) {
  const { ip, name, port } = server;
  const stmt = db.prepare(`INSERT OR REPLACE INTO servers (ip, name, port) VALUES (?, ?, ?)`);
  stmt.run(ip, name, port);
}

function removeServer(ip) {
  const stmt = db.prepare(`DELETE FROM servers WHERE ip = ?`);
  stmt.run(ip);
}

function getServers() {
  const stmt = db.prepare(`SELECT * FROM servers`);
  const rows = stmt.all();
  const servers = {};
  rows.forEach(row => {
    servers[row.ip] = { ip: row.ip, name: row.name, port: row.port };
  });
  return servers;
}

module.exports = {
  addServer,
  removeServer,
  getServers
};
