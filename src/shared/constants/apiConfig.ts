export const SAAS_BASE_URL = 'https://pharmacy.oodleslab.com/';
export let API_BASE_URL = 'https://pharmacy.oodleslab.com/';

export const setApiBaseUrl = (url: string) => {
  if (url) {
    const formatted = url.endsWith('/') ? url : `${url}/`;
    API_BASE_URL = formatted;
  }
};

export const getApiBaseUrl = (): string => API_BASE_URL;

