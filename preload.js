const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  makeRequest: (url) => ipcRenderer.invoke('make-request', url),
  getServerData: () => ipcRenderer.invoke('get-server-data')
});