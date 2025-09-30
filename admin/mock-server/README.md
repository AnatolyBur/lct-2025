# Mock Server для GarpixCMS

Этот mock сервер имитирует API бэкенда GarpixCMS для разработки фронтенда.

## Запуск

```bash
# Запуск только mock сервера
npm run mock-server

# Запуск mock сервера и dev сервера одновременно
npm run dev:full
```

Mock сервер будет доступен по адресу: http://localhost:3001

## API Эндпоинты

### Страницы

- `GET /api/admin/pages/metadata/` - Получение метаданных модели страницы
- `GET /api/admin/pages/` - Получение списка всех страниц
- `GET /api/admin/pages/:id` - Получение конкретной страницы
- `POST /api/admin/pages/` - Создание новой страницы
- `PUT /api/admin/pages/:id` - Обновление страницы
- `DELETE /api/admin/pages/:id` - Удаление страницы

### Компоненты

- `GET /api/admin/components/` - Получение списка всех компонентов
- `GET /api/admin/components/:id` - Получение конкретного компонента

## Структура данных

### Страница (PageData)
```json
{
  "id": 1,
  "title": "Заголовок страницы",
  "slug": "page-slug",
  "content": "Содержимое страницы",
  "is_published": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "meta_title": "SEO заголовок",
  "meta_description": "SEO описание",
  "meta_keywords": "ключевые, слова",
  "template": "default",
  "sort_order": "0"
}
```

### Компонент (Component)
```json
{
  "id": "text-block",
  "name": "Текстовый блок",
  "type": "content",
  "config": {
    "editable": true,
    "max_length": 1000
  },
  "fields": [
    {
      "name": "text",
      "type": "TextField",
      "required": true,
      "help_text": "Основной текст блока"
    }
  ]
}
```

## Файлы данных

- `data/pages.json` - Данные страниц
- `data/components.json` - Данные компонентов  
- `data/metadata.json` - Метаданные модели страницы

## Особенности

- Автоматическая генерация ID для новых записей
- Автоматическое добавление временных меток (created_at, updated_at)
- Поддержка CORS для фронтенда
- Graceful shutdown при остановке сервера
