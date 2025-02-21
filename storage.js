const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const getFilePath = (filename) => {
	const userDataPath = app.getPath('userData');
	return path.join(userDataPath, filename);
};

const readData = (filename) => {
	const filePath = getFilePath(filename);
	if (!fs.existsSync(filePath)) {
		return {};
	}
	const data = fs.readFileSync(filePath);
	return JSON.parse(data);
};

const writeData = (filename, data) => {
	const filePath = getFilePath(filename);
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const readServers = () => readData('servers.json');
const writeServers = (servers) => writeData('servers.json', servers);

const readSshSessions = () => readData('ssh_sessions.json');
const writeSshSessions = (sessions) => writeData('ssh_sessions.json', sessions);

const readSshLogs = () => readData('ssh-logs.json');
const writeSshLogs = (logs) => writeData('ssh-logs.json', logs);

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

const getServers = () => readServers();

const updateServer = (server) => {
	const servers = readServers();
	servers[server.ip] = server;
	writeServers(servers);
};

const addSshSession = (session) => {
	const sessions = readSshSessions();
	if (!sessions[session.serverName]) {
		sessions[session.serverName] = [];
	}
	sessions[session.serverName].push(session);
	writeSshSessions(sessions);
};

const getSshSessions = (serverName) => {
	const sessions = readSshSessions();
	return sessions[serverName] || [];
};

const addSshLog = (log) => {
	const logs = readSshLogs();
	logs.push(log);
	writeSshLogs(logs);
};

const getSshLogs = () => readSshLogs();

module.exports = {
	addServer,
	removeServer,
	getServers,
	updateServer,
	addSshSession,
	getSshSessions,
	addSshLog,
	getSshLogs
};
