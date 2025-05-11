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
      <div class="slider-container">
        <button class="prev-btn">&lt;</button>
        <div class="image-slider">
          ${product.image.map((img, index) => `
            <img src="${img}" alt="${product.name}" class="product-image ${index === 0 ? 'active' : 'hidden'}">
          `).join('')}
        </div>
        <button class="next-btn">&gt;</button>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>Cena: ${product.price} PLN</p>
        <p>${product.description}</p>
        <p>Stan magazynowy: ${product.stock}</p>
      </div>
    `;

    const images = productDiv.querySelectorAll('.product-image');
    let currentIndex = 0;

    const showImage = (index) => {
      images.forEach((img, i) => {
        img.classList.toggle('active', i === index);
        img.classList.toggle('hidden', i !== index);
      });
    };

    productDiv.querySelector('.prev-btn').addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      showImage(currentIndex);
    });

    productDiv.querySelector('.next-btn').addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % images.length;
      showImage(currentIndex);
    });

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
  const imageFiles = document.getElementById('image').files;
  for (let i = 0; i < imageFiles.length; i++) {
  formData.append('image', imageFiles[i]);
}
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