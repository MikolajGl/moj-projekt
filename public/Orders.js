const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'login.html';
}

let payload;
try {
  payload = JSON.parse(atob(token.split('.')[1]));
} catch (err) {
  alert('Błędny token. Zaloguj się ponownie.');
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

if (payload.role !== 'admin') {
  alert('Brak dostępu: tylko dla admina');
  window.location.href = 'test1.html';
}

async function fetchAllOrders() {
    const response = await fetch('http://localhost:3001/api/orders',{
        headers:{
        'Authorization': `Bearer ${token}`
        }
    });

    if(!response.ok){
        console.error('Problem with fetching orders');
        return;
    }
    const orders=await response.json();
    const ordercontainer=document.getElementById('orderlist');
    ordercontainer.innerHTML = '';

    orders.forEach(order => {
        const orderElement=document.createElement('div'); 
        orderElement.classList.add('order-item');
        orderElement.innerHTML=`
        <h3>Order ID: ${order._id}</h3>
        <p>User: ${order.userId.username}</p>
        <p>Total Price: ${order.total} PLN</p>
        <p>Address: ${order.address}</p>
        <p>Payment ID: ${order.paymentID}</p>
         <h4>Products:</h4>
        <ul>${order.products.map(p => `<li>${p.productId } -${p.name } -${p.price} - ${p.quantity} pcs</li>`).join('')}
        </ul>
        <hr>
        `;
        document.getElementById('ordersContainer').appendChild(orderElement);
    });
}

fetchAllOrders();