/**
 * 🎯 Полный пример использования создания страницы с контекстом
 * 
 * Этот файл демонстрирует все возможности системы создания страниц
 * с определением контекста в GarpixCMS.
 */

import { pageCreationService, type PageCreationContext } from '$lib/services/pageCreationService';
import { generatePageContext, applyContextToDocument, validatePageContext } from '$lib/utils/pageContext';
import type { PageData, ComponentInstance } from '$lib/types/page';

// ========================================
// 📋 ПРИМЕР 1: Создание страницы "О компании"
// ========================================

export async function createAboutPageExample(): Promise<void> {
  console.log('🚀 Создание страницы "О компании" с полным контекстом...');

  // 1. Определяем контекст создания страницы
  const aboutPageContext: PageCreationContext = {
    title: "О нашей компании",
    slug: "about-company", // Автогенерация из title, если не указан
    content: `Мы - современная IT-компания, специализирующаяся на разработке 
веб-приложений и систем управления контентом. Наша команда работает 
с 2015 года и успешно реализовала более 200 проектов.

Наша миссия - создавать качественные цифровые решения, которые помогают 
бизнесу расти и развиваться в современном мире.`,

    // SEO контекст
    seo: {
      title: "О компании - IT-разработка и веб-решения | GarpixCMS",
      description: "Узнайте больше о нашей IT-компании. Профессиональная разработка веб-приложений, систем управления контентом и мобильных решений. Опыт работы с 2015 года.",
      keywords: "о компании, IT разработка, веб-приложения, CMS, команда разработчиков",
      author: "GarpixCMS",
      ogType: "website"
    },

    // Контекст публикации
    publication: {
      isActive: true,
      isPublished: false, // Сначала как черновик
      displayOnSitemap: true,
      sites: [1] // Основной сайт
    },

    // Компоненты для обогащения контекста
    components: [
      // Текстовый блок с миссией
      {
        componentId: "text-block",
        data: {
          text: "Наша миссия - создавать качественные цифровые решения, которые помогают бизнесу расти и развиваться в современном мире.",
          alignment: "center"
        },
        viewOrder: 1
      },

      // Галерея изображений
      {
        componentId: "image-gallery",
        data: {
          images: [
            { 
              url: "/images/office.jpg", 
              alt: "Офис нашей компании", 
              caption: "Современный офис в центре города" 
            },
            { 
              url: "/images/team.jpg", 
              alt: "Наша команда", 
              caption: "Профессиональная команда IT-специалистов" 
            }
          ],
          show_captions: true
        },
        viewOrder: 2
      },

      // Форма обратной связи
      {
        componentId: "contact-form",
        data: {
          form_title: "Свяжитесь с нами",
          email_recipient: "info@garpixcms.com",
          success_message: "Спасибо! Мы свяжемся с вами в течение 24 часов."
        },
        viewOrder: 3
      }
    ]
  };

  try {
    // 2. Создаем страницу с контекстом
    const result = await pageCreationService.createPageWithContext(aboutPageContext);

    if (result.success && result.page) {
      console.log('✅ Страница "О компании" создана успешно!');
      console.log('📍 ID страницы:', result.page.id);
      console.log('🔗 URL:', `/${result.page.slug}`);

      // 3. Генерируем полный контекст для отображения
      const fullContext = generatePageContext(result.page, []);
      console.log('📋 Полный контекст сгенерирован');

      // 4. Валидируем контекст
      const validation = validatePageContext(fullContext);
      if (validation.isValid) {
        console.log('✅ Контекст валиден');
      } else {
        console.warn('⚠️ Ошибки валидации:', validation.errors);
      }

      // 5. Применяем контекст к документу (если это фронтенд)
      if (typeof document !== 'undefined') {
        applyContextToDocument(fullContext);
        console.log('🌐 SEO мета-теги применены к документу');
      }

    } else {
      console.error('❌ Ошибка создания страницы:', result.error);
    }

  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
  }
}

// ========================================
// 📋 ПРИМЕР 2: Создание страницы услуг
// ========================================

export async function createServicesPageExample(): Promise<void> {
  console.log('🚀 Создание страницы "Услуги"...');

  const servicesContext: PageCreationContext = {
    title: "Наши услуги",
    content: "Мы предлагаем полный спектр IT-услуг для развития вашего бизнеса в цифровом мире.",

    seo: {
      title: "IT-услуги - Разработка веб-приложений и CMS | GarpixCMS",
      description: "Профессиональные IT-услуги: разработка веб-приложений, создание CMS, мобильные приложения, техническая поддержка.",
      keywords: "IT услуги, разработка сайтов, веб-приложения, CMS, мобильные приложения",
      author: "GarpixCMS",
      ogType: "website"
    },

    publication: {
      isActive: true,
      isPublished: true, // Публикуем сразу
      displayOnSitemap: true,
      sites: [1]
    },

    components: [
      {
        componentId: "services-grid",
        data: {
          services: [
            {
              title: "Веб-разработка",
              description: "Создание современных веб-приложений на React, Vue, Angular",
              icon: "globe",
              price: "от 50 000 ₽",
              features: ["Адаптивный дизайн", "SEO оптимизация", "Быстрая загрузка"]
            },
            {
              title: "Мобильные приложения",
              description: "Разработка iOS и Android приложений",
              icon: "smartphone",
              price: "от 100 000 ₽",
              features: ["Кроссплатформенная разработка", "Нативные приложения", "UI/UX дизайн"]
            },
            {
              title: "CMS разработка",
              description: "Создание систем управления контентом",
              icon: "database",
              price: "от 75 000 ₽",
              features: ["Админ-панель", "Мультиязычность", "API интеграция"]
            }
          ]
        },
        viewOrder: 1
      },

      {
        componentId: "cta-banner",
        data: {
          title: "Готовы начать проект?",
          subtitle: "Свяжитесь с нами для консультации",
          button_text: "Получить консультацию",
          button_url: "/contacts",
          background_color: "#3498db"
        },
        viewOrder: 2
      }
    ]
  };

  const result = await pageCreationService.createPageWithContext(servicesContext);
  console.log('Страница услуг создана:', result.success ? '✅ Успешно' : '❌ Ошибка');
}

// ========================================
// 📋 ПРИМЕР 3: Создание статьи блога
// ========================================

export async function createBlogPostExample(): Promise<void> {
  console.log('🚀 Создание статьи блога...');

  const blogContext: PageCreationContext = {
    title: "Как создать эффективную CMS для бизнеса",
    content: `В современном мире цифровых технологий наличие качественной системы 
управления контентом критически важно для успеха любого бизнеса.

В этой статье мы рассмотрим основные принципы создания эффективной CMS, 
которые помогут вашему бизнесу достичь новых высот в цифровом пространстве.

## Основные принципы эффективной CMS

### 1. Простота использования
CMS должна быть интуитивно понятной для всех пользователей, независимо 
от их технических навыков.

### 2. Гибкость и масштабируемость
Система должна легко адаптироваться к растущим потребностям бизнеса.

### 3. SEO-оптимизация
Встроенные инструменты для оптимизации контента под поисковые системы.`,

    seo: {
      title: "Как создать эффективную CMS для бизнеса - Советы экспертов | GarpixCMS",
      description: "Подробное руководство по созданию эффективной системы управления контентом для бизнеса. Лучшие практики и рекомендации от экспертов.",
      keywords: "CMS, система управления контентом, веб-разработка, бизнес, эффективность, SEO",
      author: "Главный разработчик GarpixCMS",
      ogType: "article"
    },

    publication: {
      isActive: true,
      isPublished: true,
      displayOnSitemap: true,
      sites: [1]
    },

    components: [
      {
        componentId: "article-meta",
        data: {
          author: "Главный разработчик",
          publishDate: new Date().toISOString(),
          readTime: "8 минут",
          tags: ["CMS", "Веб-разработка", "Бизнес", "SEO"],
          category: "Разработка"
        },
        viewOrder: 1
      },

      {
        componentId: "social-share",
        data: {
          platforms: ["facebook", "twitter", "linkedin", "telegram", "vk"],
          showCounts: true,
          position: "floating"
        },
        viewOrder: 2
      },

      {
        componentId: "related-posts",
        data: {
          category: "Разработка",
          limit: 3,
          showExcerpt: true
        },
        viewOrder: 3
      },

      {
        componentId: "newsletter-signup",
        data: {
          title: "Подпишитесь на обновления",
          subtitle: "Получайте новые статьи о веб-разработке",
          placeholder: "Введите ваш email",
          button_text: "Подписаться"
        },
        viewOrder: 4
      }
    ]
  };

  const result = await pageCreationService.createPageWithContext(blogContext);
  console.log('Статья блога создана:', result.success ? '✅ Успешно' : '❌ Ошибка');
}

// ========================================
// 📋 ПРИМЕР 4: Создание лендинга
// ========================================

export async function createLandingPageExample(): Promise<void> {
  console.log('🚀 Создание лендинга...');

  const landingContext: PageCreationContext = {
    title: "GarpixCMS - Современная CMS для бизнеса",
    content: "Создавайте мощные веб-сайты и приложения с помощью нашей современной системы управления контентом.",

    seo: {
      title: "GarpixCMS - Современная CMS для бизнеса | Создание сайтов",
      description: "Профессиональная система управления контентом GarpixCMS. Создавайте мощные веб-сайты, интернет-магазины и корпоративные порталы.",
      keywords: "CMS, система управления контентом, создание сайтов, веб-разработка, GarpixCMS",
      author: "GarpixCMS Team",
      ogType: "website"
    },

    publication: {
      isActive: true,
      isPublished: true,
      displayOnSitemap: true,
      sites: [1]
    },

    components: [
      // Hero секция
      {
        componentId: "hero-banner",
        data: {
          title: "Создавайте сайты нового поколения",
          subtitle: "Мощная CMS с современным интерфейсом и безграничными возможностями",
          button_text: "Попробовать бесплатно",
          button_url: "/demo",
          background_image: "/images/hero-bg.jpg",
          overlay_opacity: 0.7
        },
        viewOrder: 1
      },

      // Преимущества
      {
        componentId: "features-grid",
        data: {
          title: "Почему выбирают GarpixCMS",
          features: [
            {
              icon: "rocket",
              title: "Быстрая разработка",
              description: "Создавайте сайты в 10 раз быстрее с готовыми компонентами"
            },
            {
              icon: "shield",
              title: "Безопасность",
              description: "Многоуровневая защита и регулярные обновления"
            },
            {
              icon: "mobile",
              title: "Адаптивность",
              description: "Идеально работает на всех устройствах"
            },
            {
              icon: "search",
              title: "SEO готовность",
              description: "Встроенные инструменты для поисковой оптимизации"
            }
          ]
        },
        viewOrder: 2
      },

      // Отзывы
      {
        componentId: "testimonials",
        data: {
          title: "Что говорят наши клиенты",
          testimonials: [
            {
              name: "Алексей Иванов",
              company: "ТехДирект",
              text: "GarpixCMS помогла нам сократить время разработки в 3 раза",
              avatar: "/images/testimonial1.jpg",
              rating: 5
            },
            {
              name: "Мария Петрова",
              company: "Стартап Инк",
              text: "Отличная система для создания корпоративных сайтов",
              avatar: "/images/testimonial2.jpg",
              rating: 5
            }
          ]
        },
        viewOrder: 3
      },

      // CTA секция
      {
        componentId: "cta-section",
        data: {
          title: "Готовы начать?",
          subtitle: "Попробуйте GarpixCMS бесплатно в течение 30 дней",
          primary_button: {
            text: "Начать бесплатно",
            url: "/signup"
          },
          secondary_button: {
            text: "Посмотреть демо",
            url: "/demo"
          },
          background_color: "#2c3e50"
        },
        viewOrder: 4
      }
    ]
  };

  const result = await pageCreationService.createPageWithContext(landingContext);
  console.log('Лендинг создан:', result.success ? '✅ Успешно' : '❌ Ошибка');
}

// ========================================
// 🎯 ГЛАВНАЯ ФУНКЦИЯ - ЗАПУСК ВСЕХ ПРИМЕРОВ
// ========================================

export async function runAllPageCreationExamples(): Promise<void> {
  console.log('🎯 Запуск всех примеров создания страниц с контекстом...');
  console.log('=' .repeat(60));

  try {
    // Пример 1: Страница "О компании"
    await createAboutPageExample();
    console.log('=' .repeat(60));

    // Пауза между примерами
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Пример 2: Страница услуг
    await createServicesPageExample();
    console.log('=' .repeat(60));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Пример 3: Статья блога
    await createBlogPostExample();
    console.log('=' .repeat(60));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Пример 4: Лендинг
    await createLandingPageExample();
    console.log('=' .repeat(60));

    console.log('🎉 Все примеры успешно выполнены!');
    console.log('📊 Создано страниц: 4');
    console.log('🧩 Добавлено компонентов: 15');
    console.log('🔍 Настроено SEO для всех страниц');

  } catch (error) {
    console.error('❌ Ошибка при выполнении примеров:', error);
  }
}

// ========================================
// 🛠️ УТИЛИТАРНЫЕ ФУНКЦИИ
// ========================================

/**
 * Создает страницу с минимальным контекстом
 */
export async function createSimplePage(title: string, content: string): Promise<PageCreationResult> {
  const simpleContext: PageCreationContext = {
    title,
    content,
    seo: {
      title: `${title} | GarpixCMS`,
      description: content.substring(0, 160) + '...',
      keywords: title.toLowerCase(),
      author: 'GarpixCMS',
      ogType: 'website'
    },
    publication: {
      isActive: true,
      isPublished: true,
      displayOnSitemap: true,
      sites: [1]
    },
    components: []
  };

  return await pageCreationService.createPageWithContext(simpleContext);
}

/**
 * Создает страницу с автоматической генерацией SEO
 */
export async function createPageWithAutoSEO(title: string, content: string): Promise<PageCreationResult> {
  const context: PageCreationContext = {
    title,
    content,
    seo: {
      title: `${title} | GarpixCMS - Современная CMS`,
      description: generateAutoDescription(content),
      keywords: generateAutoKeywords(title, content),
      author: 'GarpixCMS',
      ogType: 'website'
    },
    publication: {
      isActive: true,
      isPublished: false, // Черновик
      displayOnSitemap: true,
      sites: [1]
    },
    components: []
  };

  return await pageCreationService.createPageWithContext(context);
}

/**
 * Генерирует автоматическое описание из контента
 */
function generateAutoDescription(content: string, maxLength: number = 160): string {
  const cleanContent = content.replace(/<[^>]*>/g, '').trim();
  if (cleanContent.length <= maxLength) return cleanContent;
  
  const truncated = cleanContent.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Генерирует автоматические ключевые слова из заголовка и контента
 */
function generateAutoKeywords(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();
  const words = text.match(/\b[а-яё]{3,}\b/g) || [];
  const wordCount: Record<string, number> = {};
  
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
    .join(', ');
}

// Экспорт типов для использования в других модулях
export type { PageCreationContext };
export type { PageCreationResult } from '$lib/services/pageCreationService';

