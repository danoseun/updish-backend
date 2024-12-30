// app.js

document.getElementById('loginBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('http://127.0.0.1:1755/v1/auth/google/callback', { method: 'GET' });
        console.log('1', response.json())
        const data = await response.json();
        console.log('2', data);
        // Handle the response as needed
    } catch (error) {
        console.error('Error', error);
    }
});