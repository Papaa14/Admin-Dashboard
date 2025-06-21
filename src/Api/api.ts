// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://support.amazons.co.ke/api/support/config',
});

export default api;
