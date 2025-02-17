const fs = require('fs');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';
const storagePath = isDev ? path.join(__dirname, 'servers.json') : path.join(app.getPath('userData'), 'servers.json');

function readData() {
  if (!fs.existsSync(storagePath)) {
    return {};
  }
  const data = fs.readFileSync(storagePath, 'utf-8');
  return JSON.parse(data);
}

function writeData(data) {
  fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf-8');
}

function addServer(server) {
  const data = readData();
  data[server.ip] = server;
  writeData(data);
}

function removeServer(ip) {
  const data = readData();
  delete data[ip];
  writeData(data);
}

function getServers() {
  return readData();
}

function updateServer(server) {
  const data = readData();
  data[server.ip] = server;
  writeData(data);
}

module.exports = {
  addServer,
  removeServer,
  getServers,
  updateServer
};
