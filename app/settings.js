document.getElementById('add-server-btn').addEventListener('click', () => {
	const name = document.getElementById('server-name').value;
	const ip = document.getElementById('server-ip').value;
	const port = document.getElementById('server-port').value;

	if (!name || !ip || !port) {
		alert('Please fill in all fields.');
		return;
	}

	window.api.addServer({ name, ip, port })
		.then(response => {
			if (response.success) {
				alert('Server added successfully!');
				location.reload();
			} else {
				alert('Failed to add server: ' + response.message);
			}
		})
		.catch(error => {
			console.error('Error adding server:', error);
			alert('An error occurred while adding the server.');
		});
});
