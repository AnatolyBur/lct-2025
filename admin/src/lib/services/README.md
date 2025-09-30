# 🛠️ Сервис создания страниц с контекстом

Этот модуль предоставляет полный функционал для создания страниц в GarpixCMS с определением контекста, SEO-настройками и компонентами.

## 📋 Основные компоненты

### 1. PageCreationService
Основной сервис для создания страниц с контекстом.

```typescript
import { pageCreationService } from '$lib/services/pageCreationService';

// Создание страницы "О компании"
const result = await pageCreationService.createAboutPage();
```

### 2. ContextualPageCreator
Svelte-компонент для пошагового создания страниц через UI.

```svelte
<ContextualPageCreator 
  onSuccess={(pageId) => console.log('Страница создана:', pageId)}
  onCancel={() => console.log('Создание отменено')}
/>
```

### 3. PageContext Utils
Утилиты для работы с контекстом страниц.

```typescript
import { generatePageContext, applyContextToDocument } from '$lib/utils/pageContext';

// Генерация полного контекста
const context = generatePageContext(pageData, components);

// Применение к HTML документу
applyContextToDocument(context);
```

## 🚀 Быстрый старт

### Создание простой страницы

```typescript
import { pageCreationService, type PageCreationContext } from '$lib/services/pageCreationService';

const pageContext: PageCreationContext = {
  title: "О компании",
  content: "Описание нашей компании...",
  
  seo: {
    title: "О компании - НазваниеСайта",
    description: "Подробная информация о нашей компании",
    keywords: "о компании, информация, история",
    author: "НазваниеКомпании",
    ogType: "website"
  },
  
  publication: {
    isActive: true,
    isPublished: false,
    displayOnSitemap: true,
    sites: [1]
  },
  
  components: [
    {
      componentId: "text-block",
      data: {
        text: "Наша миссия - создавать качественные решения",
        alignment: "center"
      },
      viewOrder: 1
    }
  ]
};

const result = await pageCreationService.createPageWithContext(pageContext);
```

### Использование UI компонента

```svelte
<script>
  import ContextualPageCreator from '$lib/components/ContextualPageCreator.svelte';
  import { goto } from '$app/navigation';

  function handleSuccess(pageId) {
    goto(`/pages/${pageId}/edit`);
  }

  function handleCancel() {
    goto('/pages');
  }
</script>

<ContextualPageCreator 
  onSuccess={handleSuccess}
  onCancel={handleCancel}
/>
```

## 📝 Структура контекста страницы

### PageCreationContext
```typescript
interface PageCreationContext {
  // Основная информация
  title: string;
  slug?: string;
  content: string;
  
  // SEO контекст
  seo: {
    title: string;
    description: string;
    keywords: string;
    author: string;
    ogType: string;
    image?: File | string;
  };
  
  // Контекст публикации
  publication: {
    isActive: boolean;
    isPublished: boolean;
    displayOnSitemap: boolean;
    parentPageId?: number;
    sites: number[];
  };
  
  // Многоязычный контекст
  translations?: Array<{
    language: string;
    title: string;
    content: string;
    seo: {
      title: string;
      description: string;
      keywords: string;
    };
  }>;
  
  // Компоненты
  components: Array<{
    componentId: string;
    data: Record<string, any>;
    position?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    viewOrder?: number;
  }>;
}
```

### PageContext (полный контекст)
```typescript
interface PageContext {
  meta: {
    title: string;
    description: string;
    keywords: string;
    author: string;
    ogType: string;
    image?: string;
    url: string;
    canonicalUrl?: string;
  };
  
  content: {
    title: string;
    body: string;
    excerpt?: string;
    featuredImage?: string;
  };
  
  structure: {
    parentPage?: PageData;
    childPages: PageData[];
    breadcrumbs: Array<{ title: string; url: string }>;
    navigation: Array<{ title: string; url: string; active: boolean }>;
  };
  
  components: ComponentInstance[];
  seo: { /* SEO настройки */ };
  media: { /* Медиа контент */ };
  social: { /* Социальные сети */ };
}
```

## 🔧 API методы

### PageCreationService

#### createPageWithContext(context)
Создает страницу с полным контекстом.

**Параметры:**
- `context: PageCreationContext` - контекст создания страницы

**Возвращает:**
- `Promise<PageCreationResult>` - результат создания

#### createAboutPage()
Создает предустановленную страницу "О компании".

**Возвращает:**
- `Promise<PageCreationResult>` - результат создания

### PageContext Utils

#### generatePageContext(pageData, components)
Генерирует полный контекст страницы.

**Параметры:**
- `pageData: PageData` - данные страницы
- `components: ComponentInstance[]` - компоненты страницы

**Возвращает:**
- `PageContext` - полный контекст

#### applyContextToDocument(context)
Применяет контекст к HTML документу.

**Параметры:**
- `context: PageContext` - контекст страницы

#### validatePageContext(context)
Валидирует контекст страницы.

**Параметры:**
- `context: PageContext` - контекст страницы

**Возвращает:**
- `{ isValid: boolean; errors: string[]; warnings: string[] }`

## 📊 Примеры использования

### 1. Создание страницы "О компании"
```typescript
import { createAboutCompanyPageExample } from '$lib/examples/pageCreationExample';

await createAboutCompanyPageExample();
```

### 2. Создание страницы услуг
```typescript
import { createServicesPageExample } from '$lib/examples/pageCreationExample';

await createServicesPageExample();
```

### 3. Создание статьи блога
```typescript
import { createBlogPostExample } from '$lib/examples/pageCreationExample';

await createBlogPostExample();
```

### 4. Запуск всех примеров
```typescript
import { runAllExamples } from '$lib/examples/pageCreationExample';

await runAllExamples();
```

## 🎯 Особенности

### Валидация
- Автоматическая валидация всех полей
- Проверка длины SEO-полей
- Валидация URL и email
- Проверка обязательных полей компонентов

### SEO оптимизация
- Автогенерация мета-тегов
- Open Graph поддержка
- Twitter Cards
- Структурированные данные (JSON-LD)
- Canonical URLs

### Многоязычность
- Поддержка переводов
- Локализация контента
- Мультиязычные SEO настройки

### Компоненты
- Динамическое добавление компонентов
- Валидация данных компонентов
- Упорядочивание компонентов
- Предварительный просмотр

## 🚨 Обработка ошибок

```typescript
try {
  const result = await pageCreationService.createPageWithContext(context);
  
  if (result.success) {
    console.log('Страница создана:', result.page);
  } else {
    console.error('Ошибка:', result.error);
  }
  
  if (result.warnings?.length > 0) {
    console.warn('Предупреждения:', result.warnings);
  }
} catch (error) {
  console.error('Критическая ошибка:', error);
}
```

## 🔄 Интеграция с существующими компонентами

Сервис полностью интегрирован с существующей архитектурой GarpixCMS:

- Использует `apiClient` для работы с API
- Совместим с типами `PageData` и `ComponentInstance`
- Работает с существующими stores (`pageStore`, `componentStore`)
- Поддерживает все существующие компоненты

## 📚 Дополнительные ресурсы

- [Документация GarpixCMS](./README.md)
- [Примеры компонентов](../components/)
- [API клиент](../api/client.ts)
- [Типы данных](../types/)

