const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
//const serverManager = require('./serverManager');
//const serverDetails = require('./serverDetails');

let mainWindow; 

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 825,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('app/index.html');
}

app.whenReady().then(() => {
	createWindow()
  
	app.on('activate', () => {
	  if (BrowserWindow.getAllWindows().length === 0) {
		createWindow()
	  }
	})
  })
  app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
	  app.quit()
	}
  })

  ipcMain.handle('make-request', async (event, url) => {
	try {
	  const response = await axios.get(url);
	  return response.data;
	} catch (error) {
	  console.error('Erreur lors de la requête:', error);
	  throw error;
	}
  });

ipcMain.handle('add-server', async (event, { ip, machine }) => {
  // soon
});

ipcMain.handle('get-servers', async () => {
  // soon
});

ipcMain.handle('get-server-details', async (event, ip) => {
  try {
    return serverDetails.getDetails(ip);
  } catch (error) {
    console.error('Error getting server details:', error);
    throw error;
  }
});

ipcMain.handle('get-server-data', async () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'app', 'servers.json'));
    const servers = JSON.parse(data);

    const serverDataPromises = Object.values(servers).map(async (server) => {
      try {
        const response = await axios.get(`http://${server.ip}:${server.port}/api/ram-usage`);
        return {
          name: server.name,
          ip: server.ip,
          port: server.port,
          ram: {
            current: (response.data.usedMemory / (1024 * 1024 * 1024)).toFixed(2) + 'GB',
            max: (response.data.totalMemory / (1024 * 1024 * 1024)).toFixed(2) + 'GB',
            usagePercentage: response.data.usagePercentage.toFixed(2) + '%'
          }
        };
      } catch (error) {
        console.error(`Error fetching data for server ${server.name}:`, error);
        return {
          name: server.name,
          ip: server.ip,
          port: server.port,
          ram: {
            current: '0GB',
            max: '0GB',
            usagePercentage: '0%'
          },
        };
      }
    });

    const serverData = await Promise.all(serverDataPromises);
    return serverData;
  } catch (error) {
    console.error('Error fetching server data:', error);
    throw error;
  }
});
