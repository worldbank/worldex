import axios from 'axios';

const apiFetch = async (url: string, options = {}) => {
  const resp = await axios(`${import.meta.env.VITE_API_URL}/${url}`, options);
  return resp;
};

export default apiFetch;
