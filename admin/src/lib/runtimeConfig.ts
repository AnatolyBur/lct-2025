// Конфигурация окружения рантайма для админки

// Базовый URL лицевой части (frontend), используется для предпросмотра страниц
export const FRONTEND_BASE_URL: string = (import.meta.env.VITE_FRONTEND_BASE_URL as string) || 'http://localhost:5174/';

// Нормализует двойные слэши в URL (например, http://host//path -> http://host/path)
function normalizeUrl(url: string): string {
  return url.replace(/:\/\//, '___PROTOCOL___').replace(/\/+/g, '/').replace('___PROTOCOL___', '://');
}

// Строит абсолютный URL для показа страницы на фронте из относительного пути
export function buildFrontendUrl(pathname: string): string {
  // Убираем ведущие/хвостовые пробелы и слэши
  const cleanPath = String(pathname || '').trim();
  if (!cleanPath) return normalizeUrl(FRONTEND_BASE_URL);
  return normalizeUrl(`${FRONTEND_BASE_URL}/${cleanPath.replace(/^\/+/, '')}`);
}


