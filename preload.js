const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  makeRequest: (url) => ipcRenderer.invoke('make-request', url),
  getServerData: () => ipcRenderer.invoke('get-server-data'),
  addServer: (server) => ipcRenderer.invoke('add-server', server),
  removeServer: (ip) => ipcRenderer.invoke('remove-server', ip),
  getServers: () => ipcRenderer.invoke('get-servers'),
  updateServer: (server) => ipcRenderer.invoke('update-server', server),
  getSshSessions: (serverName) => ipcRenderer.invoke('get-ssh-sessions', serverName),
  addSshSession: (session) => ipcRenderer.invoke('add-ssh-session', session),
  getSshLogs: () => ipcRenderer.invoke('get-ssh-logs'),
  getLastUser: (server) => ipcRenderer.invoke('get-last-user', server),
  connectSSH: (details) => ipcRenderer.invoke('connect-ssh', details),
  executeCommand: (command) => ipcRenderer.invoke('execute-command', command)
});