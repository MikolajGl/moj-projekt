const token = localStorage.getItem('token');

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
  });