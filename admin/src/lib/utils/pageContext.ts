// Утилиты для работы с контекстом страниц
import type { PageData, ComponentInstance, BasePageField } from '$lib/types/page';

export interface PageContext {
  // Метаданные страницы
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
  
  // Контент страницы
  content: {
    title: string;
    body: string;
    excerpt?: string;
    featuredImage?: string;
  };
  
  // Структурный контекст
  structure: {
    parentPage?: PageData;
    childPages: PageData[];
    breadcrumbs: Array<{ title: string; url: string }>;
    navigation: Array<{ title: string; url: string; active: boolean }>;
  };
  
  // Компоненты страницы
  components: ComponentInstance[];
  
  // SEO контекст
  seo: {
    robots: string;
    language: string;
    charset: string;
    viewport: string;
    themeColor?: string;
    favicon?: string;
  };
  
  // Мультимедиа контекст
  media: {
    images: Array<{ src: string; alt: string; caption?: string }>;
    videos: Array<{ src: string; poster?: string; title?: string }>;
    documents: Array<{ src: string; title: string; type: string }>;
  };
  
  // Социальные сети
  social: {
    facebook?: {
      appId: string;
      pageUrl: string;
    };
    twitter?: {
      card: string;
      site: string;
      creator: string;
    };
    linkedin?: {
      pageUrl: string;
    };
  };
}

/**
 * Генерирует полный контекст страницы на основе данных
 */
export function generatePageContext(pageData: PageData, components: ComponentInstance[] = []): PageContext {
  return {
    meta: generateMetaContext(pageData),
    content: generateContentContext(pageData),
    structure: generateStructureContext(pageData),
    components,
    seo: generateSeoContext(pageData),
    media: generateMediaContext(components),
    social: generateSocialContext(pageData)
  };
}

/**
 * Генерирует мета-контекст для страницы
 */
function generateMetaContext(pageData: PageData): PageContext['meta'] {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const pageUrl = `${baseUrl}/${pageData.slug}`;
  
  return {
    title: pageData.seo_title || pageData.title,
    description: pageData.seo_description || generateExcerpt(pageData.content || ''),
    keywords: pageData.seo_keywords || '',
    author: pageData.seo_author || 'Сайт',
    ogType: pageData.seo_og_type || 'website',
    image: pageData.seo_image || '',
    url: pageUrl,
    canonicalUrl: pageUrl
  };
}

/**
 * Генерирует контентный контекст
 */
function generateContentContext(pageData: PageData): PageContext['content'] {
  return {
    title: pageData.title,
    body: pageData.content || '',
    excerpt: generateExcerpt(pageData.content || ''),
    featuredImage: pageData.seo_image || ''
  };
}

/**
 * Генерирует структурный контекст
 */
function generateStructureContext(pageData: PageData): PageContext['structure'] {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  return {
    parentPage: undefined, // TODO: загружать из API
    childPages: [], // TODO: загружать из API
    breadcrumbs: generateBreadcrumbs(pageData),
    navigation: generateNavigation(pageData)
  };
}

/**
 * Генерирует SEO контекст
 */
function generateSeoContext(pageData: PageData): PageContext['seo'] {
  return {
    robots: pageData.display_on_sitemap ? 'index, follow' : 'noindex, nofollow',
    language: 'ru',
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1.0',
    themeColor: '#3498db',
    favicon: '/favicon.ico'
  };
}

/**
 * Генерирует медиа-контекст из компонентов
 */
function generateMediaContext(components: ComponentInstance[]): PageContext['media'] {
  const images: PageContext['media']['images'] = [];
  const videos: PageContext['media']['videos'] = [];
  const documents: PageContext['media']['documents'] = [];

  components.forEach(component => {
    // Извлекаем изображения из компонентов
    if (component.data.images) {
      if (Array.isArray(component.data.images)) {
        component.data.images.forEach((img: any) => {
          images.push({
            src: img.url || img.src,
            alt: img.alt || '',
            caption: img.caption
          });
        });
      }
    }

    // Извлекаем видео из компонентов
    if (component.data.video) {
      videos.push({
        src: component.data.video.src,
        poster: component.data.video.poster,
        title: component.data.video.title
      });
    }

    // Извлекаем документы из компонентов
    if (component.data.document) {
      documents.push({
        src: component.data.document.src,
        title: component.data.document.title,
        type: component.data.document.type
      });
    }
  });

  return { images, videos, documents };
}

/**
 * Генерирует социальный контекст
 */
function generateSocialContext(pageData: PageData): PageContext['social'] {
  return {
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || '',
      pageUrl: process.env.FACEBOOK_PAGE_URL || ''
    },
    twitter: {
      card: 'summary_large_image',
      site: process.env.TWITTER_SITE || '',
      creator: process.env.TWITTER_CREATOR || ''
    },
    linkedin: {
      pageUrl: process.env.LINKEDIN_PAGE_URL || ''
    }
  };
}

/**
 * Генерирует краткое описание из контента
 */
function generateExcerpt(content: string, maxLength: number = 160): string {
  if (!content) return '';
  
  // Убираем HTML теги
  const textContent = content.replace(/<[^>]*>/g, '');
  
  // Обрезаем до нужной длины
  if (textContent.length <= maxLength) {
    return textContent;
  }
  
  // Ищем последний пробел перед лимитом
  const truncated = textContent.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Генерирует хлебные крошки
 */
function generateBreadcrumbs(pageData: PageData): Array<{ title: string; url: string }> {
  const breadcrumbs = [
    { title: 'Главная', url: '/' }
  ];

  // TODO: добавить логику для построения полного пути
  if (pageData.parent) {
    breadcrumbs.push({
      title: pageData.parent.title,
      url: `/${pageData.parent.slug}`
    });
  }

  breadcrumbs.push({
    title: pageData.title,
    url: `/${pageData.slug}`
  });

  return breadcrumbs;
}

/**
 * Генерирует навигацию
 */
function generateNavigation(pageData: PageData): Array<{ title: string; url: string; active: boolean }> {
  // TODO: загружать из API или конфигурации
  return [
    { title: 'Главная', url: '/', active: false },
    { title: 'О компании', url: '/about', active: pageData.slug === 'about' },
    { title: 'Услуги', url: '/services', active: false },
    { title: 'Контакты', url: '/contacts', active: false }
  ];
}

/**
 * Валидирует контекст страницы
 */
export function validatePageContext(context: PageContext): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Проверка обязательных полей
  if (!context.meta.title) {
    errors.push('Мета-заголовок обязателен');
  }

  if (!context.meta.description) {
    warnings.push('Мета-описание не указано');
  }

  if (!context.content.title) {
    errors.push('Заголовок контента обязателен');
  }

  if (!context.content.body) {
    warnings.push('Тело контента пустое');
  }

  // Проверка длины полей
  if (context.meta.title.length > 60) {
    warnings.push('Мета-заголовок превышает рекомендуемую длину 60 символов');
  }

  if (context.meta.description.length > 160) {
    warnings.push('Мета-описание превышает рекомендуемую длину 160 символов');
  }

  // Проверка URL
  if (context.meta.url && !isValidUrl(context.meta.url)) {
    errors.push('Некорректный URL страницы');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Проверяет корректность URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Применяет контекст к HTML документу
 */
export function applyContextToDocument(context: PageContext): void {
  if (typeof document === 'undefined') return;

  // Обновляем title
  if (context.meta.title) {
    document.title = context.meta.title;
  }

  // Обновляем мета-теги
  updateMetaTag('description', context.meta.description);
  updateMetaTag('keywords', context.meta.keywords);
  updateMetaTag('author', context.meta.author);
  updateMetaTag('robots', context.seo.robots);
  updateMetaTag('language', context.seo.language);

  // Open Graph теги
  updateMetaTag('og:title', context.meta.title, 'property');
  updateMetaTag('og:description', context.meta.description, 'property');
  updateMetaTag('og:type', context.meta.ogType, 'property');
  updateMetaTag('og:url', context.meta.url, 'property');
  updateMetaTag('og:image', context.meta.image, 'property');

  // Twitter Card теги
  updateMetaTag('twitter:card', context.social.twitter?.card || '', 'name');
  updateMetaTag('twitter:site', context.social.twitter?.site || '', 'name');
  updateMetaTag('twitter:title', context.meta.title, 'name');
  updateMetaTag('twitter:description', context.meta.description, 'name');
  updateMetaTag('twitter:image', context.meta.image, 'name');

  // Канонический URL
  updateLinkTag('canonical', context.meta.canonicalUrl || context.meta.url);

  // Favicon
  if (context.seo.favicon) {
    updateLinkTag('icon', context.seo.favicon);
  }
}

/**
 * Обновляет мета-тег
 */
function updateMetaTag(name: string, content: string, attribute: string = 'name'): void {
  if (!content) return;

  let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  
  meta.content = content;
}

/**
 * Обновляет link-тег
 */
function updateLinkTag(rel: string, href: string): void {
  if (!href) return;

  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  
  link.href = href;
}

/**
 * Создает JSON-LD структурированные данные
 */
export function generateStructuredData(context: PageContext): string {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": context.content.title,
    "description": context.meta.description,
    "url": context.meta.url,
    "author": {
      "@type": "Organization",
      "name": context.meta.author
    },
    "publisher": {
      "@type": "Organization",
      "name": context.meta.author
    },
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "inLanguage": context.seo.language,
    "isPartOf": {
      "@type": "WebSite",
      "name": context.meta.author,
      "url": typeof window !== 'undefined' ? window.location.origin : ''
    }
  };

  // Добавляем изображения, если есть
  if (context.media.images.length > 0) {
    structuredData.image = context.media.images.map(img => ({
      "@type": "ImageObject",
      "url": img.src,
      "caption": img.caption || img.alt
    }));
  }

  return JSON.stringify(structuredData, null, 2);
}

