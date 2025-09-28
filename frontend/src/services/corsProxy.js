// Serviço de proxy CORS para contornar restrições em produção
const CORS_PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

/**
 * Adiciona um proxy CORS a uma URL se estiver em ambiente de produção
 * @param {string} url - URL da API
 * @returns {string} URL com proxy CORS se necessário
 */
export const addCorsProxy = (url) => {
  // Verifica se estamos em ambiente de produção
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Apenas adiciona o proxy em produção e se a URL não for do mesmo domínio
  if (isProduction && url && !url.includes(window.location.hostname)) {
    return `${CORS_PROXY_URL}${url}`;
  }
  
  return url;
};