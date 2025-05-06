const fs = require('fs');
const path = require('path');

const getFilePath = (filename) => {
	
	const projectPath = path.join(__dirname, filename);
	//console.log(`Project data path: ${projectPath}`);
	return projectPath;
};

const readData = (filename) => {
	const filePath = getFilePath(filename);
	//console.log(`Reading data from: ${filePath}`); 
	if (!fs.existsSync(filePath)) {
		//console.log(`File does not exist: ${filePath}`); 
		return {};
	}
	const data = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(data);
};

const writeData = (filename, data) => {
	const filePath = getFilePath(filename);
	//console.log(`Writing data to: ${filePath}`); 
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
	//console.log('Existing servers:', servers); 
	servers[server.ip] = server;
	writeServers(servers);
	//console.log('Server added to storage:', server); 
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
