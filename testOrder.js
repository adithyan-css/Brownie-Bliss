const axios = require('axios');
(async () => {
  try {
    const response = await axios.post('http://localhost:3001/api/orders', {
      customer_name: 'Test User',
      phone: '1234567890',
      address: '123 Test St',
      city: 'Testville',
      pincode: '12345',
      items: [{ id: 1, qty: 1 }],
      total: 850,
      email: 'test@example.com'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Response:', response.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
})();
