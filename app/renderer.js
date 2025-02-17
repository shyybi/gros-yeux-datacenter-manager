window.addEventListener('DOMContentLoaded', () => {
	fetch('servers.json')
		.then(response => response.json())
		.then(data => {
			const serverContainer = document.querySelector('.server-status-container');
			Object.values(data).forEach(server => {
				const serverElement = document.createElement('div');
				serverElement.innerHTML = `
					<p><strong>Name:</strong> ${server.name}</p>
					<p><strong>IP:</strong> ${server.ip}</p>
					<p><strong>Port:</strong> ${server.port}</p>
				`;
				serverContainer.appendChild(serverElement);
			});
		})
		.catch(error => console.error('Error fetching server data:', error));
});
