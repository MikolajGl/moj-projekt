const form = document.getElementById('registerForm');
const responseDiv = document.getElementById('response');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch('http://localhost:3001/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
      responseDiv.textContent = data.message || "Rejestracja zakończona sukcesem!";
      responseDiv.className = "response-message success";
      setTimeout(() => window.location.href = "login.html", 1500);
    } else {
      responseDiv.textContent = data.message || "Błąd rejestracji.";
      responseDiv.className = "response-message error";
    }
  } catch (err) {
    responseDiv.textContent = "Błąd połączenia z serwerem.";
    responseDiv.className = "response-message error";
  }
});