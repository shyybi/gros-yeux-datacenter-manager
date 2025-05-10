const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const storage = require('./storage.js');
const { NodeSSH } = require('node-ssh');
const dotenv = require('dotenv');
const ssh = new NodeSSH();
dotenv.config();
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

  mainWindow.setMenu(null); 
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
ipcMain.handle('make-request', async (_, url) => {
ipcMain.handle('make-request', async (event, url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    //console.error('Erreur lors de la requête:', error);
    throw error;
  }
});
ipcMain.handle('add-server', async (_, server) => {
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
ipcMain.handle('remove-server', async (_, ip) => {
ipcMain.handle('remove-server', async (event, ip) => {
  try {
    storage.removeServer(ip);
    return { success: true };
  } catch (error) {
    //console.error('Error removing server:', error);
    throw error;
  }
});
ipcMain.handle('get-servers', () => {
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
ipcMain.handle('update-server', async (_, server) => {
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
ipcMain.handle('execute-ssh-command', async (_, serverName, command, username, password) => {
	try {
		const servers = storage.getServers();
		const server = Object.values(servers).find(s => s.name === serverName); // Ensure only one declaration of `server`

		if (!server) {
			throw new Error(`Server with name "${serverName}" not found.`);
		}

		if (!username || !password) {
			throw new Error('SSH credentials are missing.');
		}

		console.log(`Attempting to connect to ${server.ip}:22 as ${username}`); // Port 22 for SSH

		await ssh.connect({
			host: server.ip,
			port: 22, // Default SSH port
			username,
			password
		});

		console.log(`Connected to ${server.ip}:22. Executing command: ${command}`);
		const result = await ssh.execCommand(command);
		console.log(`Command output: ${result.stdout || result.stderr}`);
		return { output: result.stdout || result.stderr };
	} catch (error) {
		console.error('Error executing SSH command:', error);

		if (error.level === 'protocol' && error.fatal) {
			return { output: 'Connection lost before handshake. Please check your credentials, server status, or port configuration.' };
		}

		if (error.message.includes('All configured authentication methods failed')) {
			return { output: 'Authentication failed. Please verify your username and password.' };
		}

		if (error.message.includes('connect ECONNREFUSED')) {
			return { output: 'Connection refused. Please ensure the server is reachable and SSH is enabled.' };
		}

		throw error;
	} finally {
		ssh.dispose();
		console.log(`Disconnected from ${server.ip}:22`);
	}
});
