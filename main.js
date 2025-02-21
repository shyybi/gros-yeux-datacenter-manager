const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const storage = require('./storage');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 825,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.loadFile('app/index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('make-request', async (event, url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la requête:', error);
    throw error;
  }
});

ipcMain.handle('add-server', async (event, server) => {
  try {
    await axios.get(`http://${server.ip}:${server.port}/api/ram-usage`);
    storage.addServer(server);
    return { success: true };
  } catch (error) {
    console.error('Error adding server:', error);
    return { success: false, message: 'Error fetching the server API data' };
  }
});

ipcMain.handle('remove-server', async (event, ip) => {
  try {
    storage.removeServer(ip);
    return { success: true };
  } catch (error) {
    console.error('Error removing server:', error);
    throw error;
  }
});

ipcMain.handle('get-servers', (event) => {
  try {
    const servers = storage.getServers();
    return servers;
  } catch (error) {
    console.error('Error getting servers:', error);
    throw error;
  }
});

ipcMain.handle('get-server-data', async () => {
  try {
    const servers = storage.getServers();

    const fetchData = async (server) => {
      try {
        const [ramResponse, cpuResponse, diskResponse, networkResponse, sshResponse] = await Promise.all([
          axios.get(`http://${server.ip}:${server.port}/api/ram-usage`),
          axios.get(`http://${server.ip}:${server.port}/api/cpu-usage`),
          axios.get(`http://${server.ip}:${server.port}/api/disk-usage`),
          axios.get(`http://${server.ip}:${server.port}/api/network-usage`),
          axios.get(`http://${server.ip}:${server.port}/api/ssh-sessions`)
        ]);

        return {
          name: server.name,
          ip: server.ip,
          port: server.port,
          ram: {
            current: (ramResponse.data.usedMemory / (1024 * 1024 * 1024)).toFixed(2) + 'GB',
            max: (ramResponse.data.totalMemory / (1024 * 1024 * 1024)).toFixed(2) + 'GB',
            usagePercentage: ramResponse.data.usagePercentage.toFixed(2) + '%'
          },
          cpu: cpuResponse.data,
          disk: diskResponse.data,
          network: networkResponse.data,
          sshSessions: sshResponse.data.sshSessions,
          error: false
        };
      } catch (error) {
        console.error(`Error fetching data for server ${server.name}:`, error);
        return {
          name: server.name,
          ip: server.ip,
          port: server.port,
          error: true
        };
      }
    };

    const serverDataPromises = Object.values(servers).map(fetchData);
    const serverData = (await Promise.all(serverDataPromises)).filter(server => !server.error);
    return serverData;
  } catch (error) {
    console.error('Error fetching server data:', error);
    throw error;
  }
});

ipcMain.handle('update-server', async (event, server) => {
  try {
    await axios.get(`http://${server.ip}:${server.port}/api/ram-usage`);
    storage.updateServer(server);
    return { success: true };
  } catch (error) {
    console.error('Error updating server:', error);
    return { success: false, message: 'Error fetching the server API data' };
  }
});

ipcMain.handle('get-ssh-sessions', (event, serverName) => {
  try {
    const sessions = storage.getSshSessions(serverName);
    return sessions;
  } catch (error) {
    console.error('Error getting SSH sessions:', error);
    throw error;
  }
});

ipcMain.handle('add-ssh-session', (event, session) => {
  try {
    storage.addSshSession(session);
    return { success: true };
  } catch (error) {
    console.error('Error adding SSH session:', error);
    return { success: false, message: 'Error adding SSH session' };
  }
});

ipcMain.handle('get-last-user', async (event, server) => {
  try {
    const response = await axios.get(`http://${server.ip}:${server.port}/api/last-user`);
    storage.addSshLog(response.data); // Log the SSH connection
    return [response.data]; // Ensure it returns an array
  } catch (error) {
    console.error('Error fetching last user data:', error);
    throw error;
  }
});

ipcMain.handle('get-ssh-logs', (event) => {
  try {
    const logs = storage.getSshLogs();
    return logs;
  } catch (error) {
    console.error('Error getting SSH logs:', error);
    throw error;
  }
});
