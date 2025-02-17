const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const getFilePath = () => {
	const userDataPath = app.getPath('userData');
	return path.join(userDataPath, 'servers.json');
};

const readServers = () => {
	const filePath = getFilePath();
	if (!fs.existsSync(filePath)) {
		return {};
	}
	const data = fs.readFileSync(filePath);
	return JSON.parse(data);
};

const writeServers = (servers) => {
	const filePath = getFilePath();
	fs.writeFileSync(filePath, JSON.stringify(servers, null, 2));
};

const addServer = (server) => {
	const servers = readServers();
	servers[server.ip] = server;
	writeServers(servers);
};

const removeServer = (ip) => {
	const servers = readServers();
	delete servers[ip];
	writeServers(servers);
};

const getServers = () => {
	return readServers();
};

const updateServer = (server) => {
	const servers = readServers();
	servers[server.ip] = server;
	writeServers(servers);
};

module.exports = {
	addServer,
	removeServer,
	getServers,
	updateServer
};
