window.addEventListener('DOMContentLoaded', () => {
	const fetchDataAndUpdate = () => {
		window.api.getServerData()
			.then(data => {
				const serverContainer = document.querySelector('.server-container');
				serverContainer.innerHTML = ''; 

				data.forEach(server => {
					const serverElement = document.createElement('div');
					serverElement.classList.add('server-status-container');
					serverElement.innerHTML = `
						<p><strong>Name:</strong> ${server.name}</p>
						<p><strong>IP:</strong> ${server.ip}</p>
						<p><strong>Port:</strong> ${server.port}</p>
						<p><strong>Current RAM:</strong> ${server.ram.current}</p>
						<p><strong>Max RAM:</strong> ${server.ram.max}</p>
						<p><strong>Usage Percentage:</strong> ${server.ram.usagePercentage}</p>
						<canvas id="ramChart-${server.name}"></canvas>
					`;
					serverContainer.appendChild(serverElement);

					const ctx = document.getElementById(`ramChart-${server.name}`).getContext('2d');
					new Chart(ctx, {
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
							scales: {
								y: {
									beginAtZero: true
								}
							}
						}
					});
				});
			})
			.catch(error => console.error('Error fetching server data:', error));
	};
	
	fetchDataAndUpdate();

	setInterval(fetchDataAndUpdate, 5000);
});
