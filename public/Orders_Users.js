document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  let payload;
  try {
    payload = JSON.parse(atob(token.split('.')[1]));
  } catch (err) {
    alert('Błędny token. Zaloguj się ponownie.');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    console.log(req.user); 
    return;
  }

  async function fetchUserOrders() {
    const response = await fetch('http://localhost:3001/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Problem with fetching user orders');
      return;
    }

    const orders = await response.json();
    const orderContainer = document.getElementById('ordersContainer');
    orderContainer.innerHTML = '';
    orders.forEach(order => {
      const orderElement = document.createElement('div');
      orderElement.classList.add('order-item');
      orderElement.innerHTML = `
        <h3>Order ID: ${order._id}</h3>
        <p>Total Price: ${order.total} PLN</p>
        <p>Address: ${order.address}</p>
        <p>Payment ID: ${order.paymentID}</p>
        <h4>Products:</h4>
        <ul>${order.products.map(p => `<li><p>Nazwa: ${p.name}</p><p>Cena: ${p.price}</p><p>Ilość: ${p.quantity}</p></li>`).join('')}</ul>
        <hr>
      `;
      orderContainer.appendChild(orderElement);
    });
  }

  fetchUserOrders();
});