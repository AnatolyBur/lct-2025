/**
 * Утилиты для безопасного кодирования строк
 */

/**
 * Безопасная функция для кодирования строк с Unicode символами в base64
 * Использует encodeURIComponent + unescape для корректной обработки Unicode
 * 
 * @param str - строка для кодирования
 * @returns base64 закодированная строка
 */
export function safeBtoa(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error('Ошибка кодирования данных:', e);
    // В случае ошибки возвращаем закодированное сообщение об ошибке
    return btoa(unescape(encodeURIComponent(JSON.stringify({ error: 'Ошибка кодирования данных' }))));
  }
}

/**
 * Безопасная функция для декодирования base64 строк с Unicode символами
 * 
 * @param base64Str - base64 закодированная строка
 * @returns декодированная строка
 */
export function safeAtob(base64Str: string): string {
  try {
    return decodeURIComponent(escape(atob(base64Str)));
  } catch (e) {
    console.error('Ошибка декодирования данных:', e);
    return '';
  }
}

/**
 * Безопасное кодирование JSON объекта в base64
 * 
 * @param obj - объект для кодирования
 * @returns base64 закодированная JSON строка
 */
export function safeJsonBtoa(obj: any): string {
  return safeBtoa(JSON.stringify(obj));
}

/**
 * Безопасное декодирование base64 строки в JSON объект
 * 
 * @param base64Str - base64 закодированная JSON строка
 * @returns декодированный объект или null в случае ошибки
 */
export function safeJsonAtob<T = any>(base64Str: string): T | null {
  try {
    const decoded = safeAtob(base64Str);
    return JSON.parse(decoded);
  } catch (e) {
    console.error('Ошибка декодирования JSON:', e);
    return null;
  }
}

