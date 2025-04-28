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

async function fetchProducts() {
  const response = await fetch('http://localhost:3001/api/products', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const products = await response.json();

  const productList = document.getElementById('productList');
  productList.innerHTML = ''; // Очищаем контейнер перед добавлением новых продуктов

  products.forEach(product => {
    const productDiv = document.createElement('div');
    productDiv.classList.add('product-card');
    productDiv.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">Cena: ${product.price} PLN</p>
        <p class="product-description">${product.description}</p>
        <p class="product-stock">Stan magazynowy: ${product.stock}</p>
      </div>
    `;
    productList.appendChild(productDiv);
  });
}


fetchProducts();


document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const product = {
    name: document.getElementById('name').value,
    price: parseFloat(document.getElementById('price').value),
    description: document.getElementById('description').value,
    image: document.getElementById('image').value,
    stock: parseInt(document.getElementById('stock').value)
  };

  const response = await fetch('http://localhost:3001/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(product)
  });

  const result = await response.json();
  alert('Produkt dodany!');
  fetchProducts(); 
});