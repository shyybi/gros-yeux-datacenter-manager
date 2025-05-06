const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const storage = require('./storage');
require('dotenv').config(); 
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 825,
    frame: true,
    webPreferences: {
      nodeIntegration: false, 
      contextIsolation: true, 
      preload: path.join(__dirname, 'preload.js') 
    },
    autoHideMenuBar: false 
  });

  //mainWindow.setMenu(null); 
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
    //console.error('Erreur lors de la requête:', error);
    throw error;
  }
});

ipcMain.handle('add-server', async (event, server) => {
  console.log('add-server called with:', server); 
  try {
    await axios.get(`http://${server.ip}:${server.port}/api/ram-usage`);
    storage.addServer(server);
    //console.log('Server added successfully'); 
    return { success: true };
  } catch (error) {
    //console.error('Error adding server:', error);
    return { success: false, message: 'Error fetching the server API data' };
  }
});

ipcMain.handle('remove-server', async (event, ip) => {
  try {
    storage.removeServer(ip);
    return { success: true };
  } catch (error) {
    //console.error('Error removing server:', error);
    throw error;
  }
});

ipcMain.handle('get-servers', (event) => {
  try {
    const servers = storage.getServers();
    return servers;
  } catch (error) {
    //console.error('Error getting servers:', error);
    throw error;
  }
});

const inaccessibleServers = new Map(); 
async function notifySlack(server) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) {
    return;
  }

  const now = Date.now();
  const lastNotificationTime = inaccessibleServers.get(server.ip) || 0;

  
  if (now - lastNotificationTime < 1800000) { 
    //console.log(`Skipping Slack notification for ${server.name} as it was recently notified.`);
    return;
  }

  const message = {
    text: `Serveur : ${server.name} (${server.ip}:${server.port}) est inaccessible`
  };

  try {
    await axios.post(slackWebhookUrl, message, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`Notification envoyée à Slack pour le serveur : ${server.name}`);
    inaccessibleServers.set(server.ip, now); 
  } catch (error) {
    //console.error('Erreur lors de l\'envoi de la notification Slack:', error);
    return;
  }
}

ipcMain.handle('get-server-data', async () => {
  try {
    const servers = storage.getServers();

    const fetchData = async (server) => {
      try {
        const ramResponse = await axios.get(`http://${server.ip}:${server.port}/api/ram-usage`);
        const [cpuResponse, diskResponse, networkResponse] = await Promise.all([
          axios.get(`http://${server.ip}:${server.port}/api/cpu-usage`),
          axios.get(`http://${server.ip}:${server.port}/api/disk-usage`),
          axios.get(`http://${server.ip}:${server.port}/api/network-usage`)
        ]);

        inaccessibleServers.delete(server.ip); 

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
          error: false
        };
      } catch (error) {
        console.error(`Erreur lors de la récupération des données pour le serveur ${server.name}:`, error);
        await notifySlack(server); 
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
    console.error('Erreur lors de la récupération des données des serveurs:', error);
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
