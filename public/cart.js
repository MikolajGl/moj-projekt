const token = localStorage.getItem('token');
    if (!token) {
      alert('Zaloguj się, aby zamówić.');
      window.location.href = 'login.html';
    }

    const productsContainer = document.getElementById('products');
    const cartContainer = document.getElementById('cart');
    const cart = [];

    async function fetchProducts() {
      const res = await fetch('http://localhost:3001/api/products');
      const products = await res.json();

      products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product';
        div.innerHTML = `
          <h3>${product.name}</h3>
          <p>Cena: ${product.price} zł</p>
          <input type="number" id="qty-${product._id}" min="1" value="1">
          <button
          data-stock="${product.stock}" 
          onclick="addToCart('${product._id}', '${product.name}', ${product.price}, ${product.stock})">Dodaj do koszyka</button>
          <p>Ilość na stanie: ${product.stock}</p>
        `;
        productsContainer.appendChild(div);
      });
    }

    function addToCart(id, name, price, stock) {
      let quantity = parseInt(document.getElementById(`qty-${id}`).value);
      const existing = cart.find(p => p.productId === id);
      const currentInCart = existing ? existing.quantity : 0;
    
      if (quantity + currentInCart > stock) {
        const available = stock - currentInCart;
        if (available <= 0) {
          alert("Nie możesz dodać więcej – osiągnięto limit magazynowy.");
          return;
        }
        alert(`Nie ma tyle dostępnych produktów. Możesz dodać jeszcze maksymalnie ${available} szt.`);
        quantity = available;
      }
    
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({ productId: id, name, price, quantity });
      }
    
      renderCart();
    }

    function renderCart() {
      cartContainer.innerHTML = '';
      let total = 0;
      cart.forEach(item => {
        total += item.price * item.quantity;
        cartContainer.innerHTML += `<p>${item.name} x${item.quantity} - ${item.price * item.quantity} zł</p>`;
      });
      cartContainer.innerHTML += `<p><strong>Razem: ${total.toFixed(2)} zł</strong></p>`;
    }

    document.getElementById('orderButton').addEventListener('click', async () => {
      const address = prompt('Podaj adres dostawy:');
      const paymentID = 'PAY-' + Math.random().toString(36).substring(7);

      const res = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          products: cart,
          address,
          paymentID
        })
      });

      if (res.ok) {
        alert('Zamówienie złożone!');
        cart.length = 0;
        renderCart();
      } else {
        const msg = await res.text();
        alert('Błąd zamówienia: ' + msg);
      }
    });

    fetchProducts();