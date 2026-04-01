const API_BASE_URL_RAW = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_BASE_URL = API_BASE_URL_RAW.startsWith('http') ? API_BASE_URL_RAW : `https://${API_BASE_URL_RAW}`;

export default API_BASE_URL;
