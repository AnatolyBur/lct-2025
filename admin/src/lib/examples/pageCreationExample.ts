// Пример использования создания страницы с контекстом
import { pageCreationService, type PageCreationContext } from '$lib/services/pageCreationService';
import { generatePageContext, applyContextToDocument, generateStructuredData } from '$lib/utils/pageContext';
import type { PageData, ComponentInstance } from '$lib/types/page';

/**
 * Пример создания страницы "О компании" с полным контекстом
 */
export async function createAboutCompanyPageExample(): Promise<void> {
  console.log('🚀 Начинаем создание страницы "О компании" с контекстом...');

  // 1. Определяем контекст создания страницы
  const pageContext: PageCreationContext = {
    title: "О нашей компании",
    slug: "about-company", // Можно не указывать, сгенерируется автоматически
    content: `Мы - современная IT-компания, специализирующаяся на разработке 
веб-приложений и систем управления контентом. Наша команда работает 
с 2015 года и успешно реализовала более 200 проектов.

Наша миссия - создавать качественные цифровые решения, которые помогают 
бизнесу расти и развиваться в современном мире. Мы используем 
передовые технологии и следуем лучшим практикам разработки.`,

    // SEO контекст
    seo: {
      title: "О компании - IT-разработка и веб-решения | GarpixCMS",
      description: "Узнайте больше о нашей IT-компании. Профессиональная разработка веб-приложений, систем управления контентом и мобильных решений. Опыт работы с 2015 года.",
      keywords: "о компании, IT разработка, веб-приложения, CMS, команда разработчиков, GarpixCMS",
      author: "GarpixCMS",
      ogType: "website"
    },

    // Контекст публикации
    publication: {
      isActive: true,
      isPublished: false, // Сначала создаем как черновик
      displayOnSitemap: true,
      sites: [1] // ID основного сайта
    },

    // Многоязычный контекст
    translations: [
      {
        language: "en",
        title: "About Our Company",
        content: "We are a modern IT company specializing in web application development and content management systems...",
        seo: {
          title: "About Our Company - IT Development and Web Solutions | GarpixCMS",
          description: "Learn more about our IT company. Professional web application development, content management systems and mobile solutions.",
          keywords: "about company, IT development, web applications, CMS, development team, GarpixCMS"
        }
      }
    ],

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
              alt: "Наша команда разработчиков", 
              caption: "Профессиональная команда IT-специалистов" 
            },
            { 
              url: "/images/projects.jpg", 
              alt: "Примеры наших проектов", 
              caption: "Успешно реализованные проекты" 
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
          success_message: "Спасибо за ваше сообщение! Мы свяжемся с вами в течение 24 часов."
        },
        viewOrder: 3
      },

      // Статистический блок
      {
        componentId: "stats-block",
        data: {
          stats: [
            { label: "Годы опыта", value: "9+", icon: "calendar" },
            { label: "Проектов", value: "200+", icon: "briefcase" },
            { label: "Довольных клиентов", value: "150+", icon: "users" },
            { label: "Сотрудников", value: "25+", icon: "team" }
          ],
          layout: "grid"
        },
        viewOrder: 4
      }
    ]
  };

  try {
    // 2. Создаем страницу с контекстом
    console.log('📝 Создаем страницу с определенным контекстом...');
    const result = await pageCreationService.createPageWithContext(pageContext);

    if (result.success && result.page) {
      console.log('✅ Страница успешно создана!', result.page);

      // 3. Генерируем полный контекст страницы
      console.log('🔍 Генерируем полный контекст страницы...');
      
      // Загружаем компоненты страницы (в реальном приложении это делается через API)
      const pageComponents: ComponentInstance[] = [
        // Здесь будут реальные компоненты из API
      ];

      const fullContext = generatePageContext(result.page, pageComponents);
      console.log('📋 Полный контекст страницы:', fullContext);

      // 4. Применяем контекст к документу (если это фронтенд)
      if (typeof document !== 'undefined') {
        console.log('🌐 Применяем контекст к HTML документу...');
        applyContextToDocument(fullContext);

        // 5. Добавляем структурированные данные
        const structuredData = generateStructuredData(fullContext);
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = structuredData;
        document.head.appendChild(script);
        console.log('📊 Структурированные данные добавлены');
      }

      // 6. Показываем результат
      console.log('🎉 Страница "О компании" создана с полным контекстом!');
      console.log('📍 URL страницы:', `/${result.page.slug}`);
      console.log('🔍 SEO заголовок:', fullContext.meta.title);
      console.log('📝 SEO описание:', fullContext.meta.description);
      console.log('🧩 Количество компонентов:', pageContext.components.length);

      // 7. Публикуем страницу (если нужно)
      if (result.page.id) {
        console.log('📢 Публикуем страницу...');
        // await pageCreationService.publishPage(result.page.id);
      }

    } else {
      console.error('❌ Ошибка создания страницы:', result.error);
    }

  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
  }
}

/**
 * Пример создания страницы с услугами
 */
export async function createServicesPageExample(): Promise<void> {
  const servicesContext: PageCreationContext = {
    title: "Наши услуги",
    content: "Мы предлагаем полный спектр IT-услуг для развития вашего бизнеса.",

    seo: {
      title: "IT-услуги - Разработка веб-приложений и CMS | GarpixCMS",
      description: "Профессиональные IT-услуги: разработка веб-приложений, создание CMS, мобильные приложения, техническая поддержка.",
      keywords: "IT услуги, разработка сайтов, веб-приложения, CMS, мобильные приложения",
      author: "GarpixCMS",
      ogType: "website"
    },

    publication: {
      isActive: true,
      isPublished: true,
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
              description: "Создание современных веб-приложений",
              icon: "globe",
              price: "от 50 000 ₽"
            },
            {
              title: "Мобильные приложения",
              description: "Разработка iOS и Android приложений",
              icon: "smartphone",
              price: "от 100 000 ₽"
            },
            {
              title: "CMS разработка",
              description: "Создание систем управления контентом",
              icon: "database",
              price: "от 75 000 ₽"
            }
          ]
        },
        viewOrder: 1
      }
    ]
  };

  const result = await pageCreationService.createPageWithContext(servicesContext);
  console.log('Страница услуг создана:', result);
}

/**
 * Пример создания блога с контекстом
 */
export async function createBlogPostExample(): Promise<void> {
  const blogContext: PageCreationContext = {
    title: "Как создать эффективную CMS для бизнеса",
    content: "В современном мире цифровых технологий наличие качественной системы управления контентом критически важно для успеха любого бизнеса...",

    seo: {
      title: "Как создать эффективную CMS для бизнеса - Советы экспертов",
      description: "Подробное руководство по созданию эффективной системы управления контентом для бизнеса. Лучшие практики и рекомендации.",
      keywords: "CMS, система управления контентом, веб-разработка, бизнес, эффективность",
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
          readTime: "5 минут",
          tags: ["CMS", "Веб-разработка", "Бизнес"]
        },
        viewOrder: 1
      },
      {
        componentId: "social-share",
        data: {
          platforms: ["facebook", "twitter", "linkedin", "telegram"],
          showCounts: true
        },
        viewOrder: 2
      },
      {
        componentId: "related-posts",
        data: {
          category: "CMS",
          limit: 3
        },
        viewOrder: 3
      }
    ]
  };

  const result = await pageCreationService.createPageWithContext(blogContext);
  console.log('Статья блога создана:', result);
}

/**
 * Функция для демонстрации всех примеров
 */
export async function runAllExamples(): Promise<void> {
  console.log('🎯 Запуск всех примеров создания страниц с контекстом...');
  
  try {
    await createAboutCompanyPageExample();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Пауза между примерами
    
    await createServicesPageExample();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createBlogPostExample();
    
    console.log('🎉 Все примеры успешно выполнены!');
  } catch (error) {
    console.error('❌ Ошибка при выполнении примеров:', error);
  }
}

// Экспорт для использования в компонентах
export { pageCreationService };
export type { PageCreationContext };

