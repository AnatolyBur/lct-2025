# GarpixCMS Admin UI

UI редактор страниц для системы управления контентом GarpixCMS.

## Описание проекта

Этот проект представляет собой веб-интерфейс для создания и редактирования страниц в GarpixCMS. Основные возможности:

- **Динамическое создание форм** на основе метаданных модели BasePage с бэкенда
- **Система компонентов** для расширения функциональности страниц
- **Валидация данных** в реальном времени
- **Интуитивный интерфейс** для управления контентом

## Технологический стек

- **Frontend**: SvelteKit + TypeScript
- **Backend API**: Django + Django REST Framework
- **Mock Server**: Node.js (для разработки)
- **Сборка**: Vite

## Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Запуск приложения
```bash
# Запуск mock сервера и dev сервера одновременно
npm run dev:full

# Или по отдельности:
npm run mock-server  # Mock API на порту 3001
npm run dev          # Frontend на порту 5173
```

### 3. Открыть в браузере
- **Frontend**: http://localhost:5173
- **Mock API**: http://localhost:3001/api

## Основные возможности

✅ **Динамическое создание форм** на основе метаданных модели BasePage  
✅ **CRUD операции** для страниц (создание, чтение, обновление, удаление)  
✅ **Валидация форм** в реальном времени  
✅ **Система уведомлений** для обратной связи  
✅ **Адаптивный дизайн** для всех устройств  
✅ **TypeScript** для типобезопасности  
✅ **Mock сервер** для разработки без бэкенда  

## Структура проекта

```
admin/
├── src/
│   ├── lib/
│   │   ├── api/           # API клиент для работы с бэкендом
│   │   ├── components/    # Переиспользуемые UI компоненты
│   │   ├── stores/        # Svelte stores для управления состоянием
│   │   ├── types/         # TypeScript типы
│   │   └── utils/         # Утилиты и хелперы
│   └── routes/            # Страницы приложения
├── mock-server/           # Mock сервер для разработки
│   ├── data/             # Mock данные (JSON)
│   └── server.cjs        # Node.js сервер
└── package.json
```

## Доступные команды

- `npm run dev` - Запуск dev сервера
- `npm run build` - Сборка для продакшена
- `npm run preview` - Предварительный просмотр сборки
- `npm run mock-server` - Запуск mock сервера
- `npm run dev:full` - Запуск mock сервера и dev сервера одновременно
- `npm run check` - Проверка типов TypeScript

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
