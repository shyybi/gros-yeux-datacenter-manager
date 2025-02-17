window.addEventListener('DOMContentLoaded', () => {
	const fetchDataAndUpdate = async () => {
		try {
			const data = await window.api.getServerData();
			const serverContainer = document.querySelector('.server-container');
			if (serverContainer) {
				serverContainer.innerHTML = ''; 

				data.forEach(server => {
					if (!server.error) {
						const serverElement = document.createElement('div');
						serverElement.classList.add('server-status-container');
						serverElement.innerHTML = `
							<div class="server-info">
								<p><strong>Name: </strong>${server.name}</p>
								<p><strong>IP: </strong>${server.ip}</p>
								<p><strong>Port: </strong>${server.port}</p>
								<p><strong>SSH Sessions: </strong>${server.sshSessions}</p>
							</div>
							<div class="server-chart">
								<canvas id="ramChart-${server.name}"></canvas>
								<p>Usage Percentage: ${server.ram.usagePercentage}</p>
							</div>
							<div class="server-chart">
								<canvas id="cpuChart-${server.name}"></canvas>
								<p>CPU Usage: ${server.cpu.currentLoad.toFixed(2)}%</p>
							</div>
							<div class="server-chart">
								<canvas id="diskChart-${server.name}"></canvas>
								<p>Disk Usage: ${(server.disk[0].used / (1024 * 1024 * 1024)).toFixed(2)}GB / ${(server.disk[0].size / (1024 * 1024 * 1024)).toFixed(2)}GB</p>
							</div>
							<div class="server-chart">
								<canvas id="networkChart-${server.name}"></canvas>
								<p>Network Usage: ${(server.network[0].rx_sec / (1024 * 1024)).toFixed(2)}MB/s / ${(server.network[0].tx_sec / (1024 * 1024)).toFixed(2)}MB/s</p>
							</div>
						`;
						serverContainer.appendChild(serverElement);

						const ramCtx = document.getElementById(`ramChart-${server.name}`).getContext('2d');
						const ramChart = new Chart(ramCtx, {
							type: 'bar',
							data: {
								labels: ['Used Memory', 'Free Memory'],
								datasets: [{
									label: 'RAM Usage',
									data: [parseFloat(server.ram.current), parseFloat(server.ram.max) - parseFloat(server.ram.current)],
									backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(75, 192, 192, 0.2)'],
									borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
									borderWidth: 1
								}]
							},
							options: {
								animation: {
									duration: 1000,
									easing: 'easeInOutQuad'
								},
								scales: {
									y: {
										beginAtZero: true
									}
								}
							}
						});

						const cpuCtx = document.getElementById(`cpuChart-${server.name}`).getContext('2d');
						const cpuChart = new Chart(cpuCtx, {
							type: 'doughnut',
							data: {
								labels: ['CPU Load'],
								datasets: [{
									label: 'CPU Usage',
									data: [server.cpu.currentLoad, 100 - server.cpu.currentLoad],
									backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(201, 203, 207, 0.2)'],
									borderColor: ['rgba(54, 162, 235, 1)', 'rgba(201, 203, 207, 1)'],
									borderWidth: 1
								}]
							},
							options: {
								animation: {
									duration: 1000,
									easing: 'easeInOutQuad'
								},
								cutout: '70%'
							}
						});

						const diskCtx = document.getElementById(`diskChart-${server.name}`).getContext('2d');
						const diskChart = new Chart(diskCtx, {
							type: 'bar',
							data: {
								labels: ['Used Disk', 'Free Disk'],
								datasets: [{
									label: 'Disk Usage',
									data: [parseFloat(server.disk[0].used / (1024 * 1024 * 1024)), parseFloat(server.disk[0].size / (1024 * 1024 * 1024)) - parseFloat(server.disk[0].used / (1024 * 1024 * 1024))],
									backgroundColor: ['rgba(153, 102, 255, 0.2)', 'rgba(75, 192, 192, 0.2)'],
									borderColor: ['rgba(153, 102, 255, 1)', 'rgba(75, 192, 192, 1)'],
									borderWidth: 1
								}]
							},
							options: {
								animation: {
									duration: 1000,
									easing: 'easeInOutQuad'
								},
								scales: {
									y: {
										beginAtZero: true
									}
								}
							}
						});

						const networkCtx = document.getElementById(`networkChart-${server.name}`).getContext('2d');
						const networkChart = new Chart(networkCtx, {
							type: 'bar',
							data: {
								labels: ['Received', 'Transmitted'],
								datasets: [{
									label: 'Network Usage',
									data: [parseFloat(server.network[0].rx_sec / (1024 * 1024)), parseFloat(server.network[0].tx_sec / (1024 * 1024))],
									backgroundColor: ['rgba(255, 159, 64, 0.2)', 'rgba(75, 192, 192, 0.2)'],
									borderColor: ['rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)'],
									borderWidth: 1
								}]
							},
							options: {
								animation: {
									duration: 1000,
									easing: 'easeInOutQuad'
								},
								scales: {
									y: {
										beginAtZero: true
									}
								}
							}
						});

						setInterval(async () => {
							try {
								const updatedData = await window.api.getServerData();
								const updatedServer = updatedData.find(s => s.name === server.name);
								if (updatedServer && !updatedServer.error) {
									ramChart.data.datasets[0].data = [parseFloat(updatedServer.ram.current), parseFloat(updatedServer.ram.max) - parseFloat(updatedServer.ram.current)];
									ramChart.update();

									cpuChart.data.datasets[0].data = [updatedServer.cpu.currentLoad, 100 - updatedServer.cpu.currentLoad];
									cpuChart.update();

									diskChart.data.datasets[0].data = [parseFloat(updatedServer.disk[0].used / (1024 * 1024 * 1024)), parseFloat(updatedServer.disk[0].size / (1024 * 1024 * 1024)) - parseFloat(updatedServer.disk[0].used / (1024 * 1024 * 1024))];
									diskChart.update();

									networkChart.data.datasets[0].data = [parseFloat(updatedServer.network[0].rx_sec / (1024 * 1024)), parseFloat(updatedServer.network[0].tx_sec / (1024 * 1024))];
									networkChart.update();
								}
							} catch (error) {
								console.error('Error fetching updated server data:', error);
							}
						}, 5000);
					}
				});
			}
		} catch (error) {
			console.error('Error fetching server data:', error);
		}
	};

	const updateServerList = async () => {
		try {
			const servers = await window.api.getServers();
			const serverList = document.getElementById('server-list');
			if (serverList) {
				serverList.innerHTML = '';
				Object.values(servers).forEach(server => {
					const listItem = document.createElement('li');
					listItem.innerHTML = `${server.name} (${server.ip}:${server.port}) <button class="delete-server-btn" data-ip="${server.ip}">❌</button>`;
					if (server.error) {
						listItem.innerHTML = `[ERROR] ${listItem.innerHTML}`;
					}
					serverList.appendChild(listItem);
				});

				document.querySelectorAll('.delete-server-btn').forEach(button => {
					button.addEventListener('click', async (event) => {
						const ip = event.target.getAttribute('data-ip');
						try {
							const response = await window.api.removeServer(ip);
							if (response.success) {
								await fetchDataAndUpdate();
								await updateServerList();
							}
						} catch (error) {
							console.error('Error removing server:', error);
						}
					});
				});
			}
		} catch (error) {
			console.error('Error fetching server list:', error);
		}
	};

	const initialize = async () => {
		await fetchDataAndUpdate();
		await updateServerList();
	};

	initialize();

	const addServerBtn = document.getElementById('add-server-btn');
	if (addServerBtn) {
		addServerBtn.addEventListener('click', async () => {
			const name = document.getElementById('server-name').value;
			const ip = document.getElementById('server-ip').value;
			const port = document.getElementById('server-port').value;
			const errorMessageElement = document.getElementById('add-server-error');
			
			const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 5000));
			try {
				const response = await Promise.race([window.api.addServer({ name, ip, port }), timeout]);
				if (response.success) {
					await fetchDataAndUpdate();
					await updateServerList();
					errorMessageElement.textContent = ''; 
				} else {
					errorMessageElement.textContent = "Error while fetching the server API's data";
				}
			} catch (error) {
				console.error('Error adding server:', error);
				errorMessageElement.textContent = 'An error occurred while adding the server. Is the API working correctly?';
			}

			setTimeout(() => {
				errorMessageElement.textContent = '';
			}, 5000);
		});
	}

	const removeServerBtn = document.getElementById('remove-server-btn');
	if (removeServerBtn) {
		removeServerBtn.addEventListener('click', async () => {
			const ip = document.getElementById('remove-server-ip').value;
			const errorMessageElement = document.getElementById('add-server-error');
			
			const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 5000));
			try {
				const response = await Promise.race([window.api.removeServer(ip), timeout]);
				if (response.success) {
					await fetchDataAndUpdate();
					await updateServerList();
					errorMessageElement.textContent = ''; 
				} else {
					errorMessageElement.textContent = "Error while removing the server.";
				}
			} catch (error) {
				console.error('Error removing server:', error);
				errorMessageElement.textContent = 'An error occurred while removing the server.';
			}

			setTimeout(() => {
				errorMessageElement.textContent = '';
			}, 5000);
		});
	}
});
