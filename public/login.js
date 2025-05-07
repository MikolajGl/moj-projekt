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

    
    if (!response.ok) {
      const error = await response.json();
      console.error('Login error:', error.message);
      document.getElementById('responseMessage').innerText = `Błąd: ${error.message}`;
      return;
    }

   
    const { token } = await response.json();

    if (!token) {
      console.error('Token is missing');
      document.getElementById('responseMessage').innerText = "Błąd: Brak tokena.";
      return;
    }

    
    localStorage.setItem('token', token);

   
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role;

    if (role === 'admin') {
      window.location.href = '/protected/admin.html'; 
    } else {
      window.location.href = 'test1.html'; 
    }
  } catch (err) {
    console.error('Błąd logowania:', err);
    document.getElementById('responseMessage').innerText = "Nie udało się zalogować.";
  }
});