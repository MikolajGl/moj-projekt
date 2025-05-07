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
  productList.innerHTML = ''; 

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

  const formData = new FormData();
  formData.append('name', document.getElementById('name').value);
  formData.append('price', parseFloat(document.getElementById('price').value));
  formData.append('description', document.getElementById('description').value);
  formData.append('stock', parseInt(document.getElementById('stock').value));
  formData.append('image', document.getElementById('image').files[0]); 
  try {
    const response = await fetch('http://localhost:3001/api/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}` 
      },
      body: formData 
    });

    if (response.ok) {
      alert('Produkt dodany!');
      fetchProducts();
    } else {
      const error = await response.json();
      alert(`Błąd: ${error.message}`);
    }
  } catch (err) {
    console.error('Błąd podczas dodawania produktu:', err);
    alert('Nie udało się dodać produktu.');
  }
});