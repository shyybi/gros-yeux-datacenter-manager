const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  makeRequest: (url) => ipcRenderer.invoke('make-request', url),
  getServerData: () => ipcRenderer.invoke('get-server-data'),
  addServer: (server) => ipcRenderer.invoke('add-server', server),
  removeServer: (ip) => ipcRenderer.invoke('remove-server', ip),
  getServers: () => ipcRenderer.invoke('get-servers'),
  updateServer: (server) => ipcRenderer.invoke('update-server', server)
});