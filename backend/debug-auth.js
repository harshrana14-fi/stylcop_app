const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Create form data
const formData = new FormData();
formData.append('name', 'Test User');
formData.append('email', 'test@example.com');
formData.append('password', 'test123');
formData.append('college', 'Test College');
formData.append('age', '25');

console.log('Testing signup endpoint...');

// Make request
axios({
  method: 'POST',
  url: 'http://localhost:5000/api/auth/signup',
  data: formData,
  headers: {
    ...formData.getHeaders()
  },
  timeout: 10000
})
.then(response => {
  console.log('Success:', response.data);
})
.catch(error => {
  if (error.response) {
    console.log('Response data:', error.response.data);
    console.log('Status:', error.response.status);
    console.log('Headers:', error.response.headers);
  } else {
    console.log('Error:', error.message);
  }
});