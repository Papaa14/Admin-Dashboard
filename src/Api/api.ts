// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://support.amazons.co.ke/api/support',
    headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

export default api;
