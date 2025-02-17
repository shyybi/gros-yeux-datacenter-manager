const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const serverManager = require('./serverManager');
const serverDetails = require('./serverDetails');

let mainWindow; 

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 825,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
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
  // ...existing code...
});

ipcMain.handle('get-servers', async () => {
  // ...existing code...
});

ipcMain.handle('get-server-details', async (event, ip) => {
  try {
    return serverDetails.getDetails(ip);
  } catch (error) {
    console.error('Error getting server details:', error);
    throw error;
  }
});
