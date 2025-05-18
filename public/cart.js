const token = localStorage.getItem('token');
if (!token) {
    alert('Zaloguj się, aby zamówić.');
    window.location.href = 'login.html';
}

const productsContainer = document.getElementById('products');
const cartContainer = document.getElementById('cart');
const searchInput = document.getElementById('searchProducts');
const modal = document.getElementById('orderModal');
const cart = [];

try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    document.getElementById('userName').textContent = payload.username;
} catch (err) {
    console.error('Token parsing error:', err);
}

async function fetchProducts() {
    try {
        const res = await fetch('http://localhost:3001/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!res.ok) throw new Error('Failed to fetch products');
        
        const products = await res.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error:', error);
        productsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                Nie udało się załadować produktów
            </div>
        `;
    }
}

function displayProducts(products, searchTerm = '') {
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  productsContainer.innerHTML = filteredProducts.map((product, index) => {
    const images = product.image.map((img, i) => `
      <img src="${img}" 
           alt="${product.name}" 
           class="product-image ${i === 0 ? 'active' : 'hidden'}"
           onerror="this.src='images/placeholder.png'">`
    ).join('');

    return `
      <div class="product-card" data-index="${index}">
        <div class="slider-container">
          <button class="prev-btn" onclick="changeSlide(${index}, -1)">&lt;</button>
          <div class="image-slider">
            ${images}
          </div>
          <button class="next-btn" onclick="changeSlide(${index}, 1)">&gt;</button>
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-price">${product.price.toFixed(2)} zł</p>
          <p class="product-stock">Na stanie: ${product.stock} szt.</p>
          <div class="product-actions">
            <div class="quantity-control">
              <button onclick="updateQuantity('${product._id}', -1)" class="qty-btn">-</button>
              <input type="number" 
                     id="qty-${product._id}" 
                     value="1" 
                     min="1" 
                     max="${product.stock}" 
                     class="qty-input">
              <button onclick="updateQuantity('${product._id}', 1)" class="qty-btn">+</button>
            </div>
            <button onclick="addToCart('${product._id}', '${product.name}', ${product.price}, ${product.stock})"
                    class="add-to-cart">
              <i class="fas fa-cart-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('') || '<div class="no-products">Nie znaleziono produktów</div>';
}

function changeSlide(productIndex, direction) {
  const productCard = document.querySelector(`.product-card[data-index="${productIndex}"]`);
  const images = productCard.querySelectorAll('.product-image');

  let currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
  currentIndex = (currentIndex + direction + images.length) % images.length;

  images.forEach((img, i) => {
    img.classList.toggle('active', i === currentIndex);
    img.classList.toggle('hidden', i !== currentIndex);
  });
} 


function updateQuantity(productId, change) {
    const input = document.getElementById(`qty-${productId}`);
    const newValue = parseInt(input.value) + change;
    if (newValue >= 1 && newValue <= parseInt(input.max)) {
        input.value = newValue;
    }
}

function addToCart(id, name, price, stock) {
    const quantity = parseInt(document.getElementById(`qty-${id}`).value);
    const existing = cart.find(p => p.productId === id);
    const currentInCart = existing ? existing.quantity : 0;

    if (quantity + currentInCart > stock) {
        const available = stock - currentInCart;
        if (available <= 0) {
            showNotification("Nie możesz dodać więcej – osiągnięto limit magazynowy.", "error");
            return;
        }
        showNotification(`Dostępne tylko ${available} szt.`, "warning");
        return;
    }

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ productId: id, name, price, quantity });
    }

    updateCart();
    showNotification("Dodano do koszyka", "success");
}

function updateCart() {
    let total = 0;
    cartContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">${itemTotal.toFixed(2)} zł</span>
                </div>
                <div class="item-controls">
                    <button onclick="updateCartItem('${item.productId}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItem('${item.productId}', 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.productId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    document.getElementById('totalPrice').textContent = `${total.toFixed(2)} zł`;
    document.getElementById('cartCount').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartItem(productId, change) {
    const item = cart.find(p => p.productId === productId);
    if (item) {
        item.quantity = Math.max(1, item.quantity + change);
        updateCart();
    }
}

function removeFromCart(productId) {
    const index = cart.findIndex(p => p.productId === productId);
    if (index > -1) {
        cart.splice(index, 1);
        updateCart();
        showNotification("Usunięto z koszyka", "info");
    }
}

document.getElementById('orderButton')?.addEventListener('click', () => {
    if (cart.length === 0) {
        showNotification("Koszyk jest pusty", "warning");
        return;
    }
    modal.style.display = 'block';
});

document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const orderData = {
    products: cart,
    address: document.getElementById('address').value,
    paymentID: document.getElementById('payment').value
};

    try {
        const res = await fetch('http://localhost:3001/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (!res.ok) {
  const errorText = await res.text();
  throw new Error(errorText || 'Order failed');
}
        showNotification("Zamówienie złożone pomyślnie!", "success");
        cart.length = 0;
        updateCart();
        closeModal();
        updateProducts();
        location.reload();
    } catch (error) {
        showNotification("Błąd podczas składania zamówienia", "error");
        location.reload();
    }
});

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'error' ? 'exclamation-circle' : 
                          type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

searchInput?.addEventListener('input', (e) => {
    const term = e.target.value;
    fetchProducts().then(products => displayProducts(products, term));
});

function closeModal() {
    modal.style.display = 'none';
}

window.onclick = (event) => {
    if (event.target === modal) {
        closeModal();
    }
};

document.getElementById('clearCart')?.addEventListener('click', () => {
    if (confirm('Czy na pewno chcesz wyczyścić koszyk?')) {
        cart.length = 0;
        updateCart();
        showNotification("Koszyk został wyczyszczony", "info");
    }
});

fetchProducts();
updateCart();