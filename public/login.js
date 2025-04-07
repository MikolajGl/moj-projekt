const form = document.getElementById('loginForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (response.ok) {
      const token = result.token;
      console.log('Server response:', result);
      localStorage.setItem('token', token);
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;
    
      if (role === 'admin') {
        window.location.href = '/protected/admin.html';
      } else {
        window.location.href = 'test1.html';//??????????????
      }
    } else {
      document.getElementById('responseMessage').innerText = result.message;
    }
  } catch (error) {
    console.error("Błąd logowania:", error);
    document.getElementById('responseMessage').innerText = "Błąd połączenia z serwerem";
  }
});