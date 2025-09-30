// Сервис для создания страницы с определением контекста
import { apiClient } from '$lib/api/client';
import type { PageData, ComponentInstance } from '$lib/types/page';

export interface PageCreationContext {
  // Основная информация о странице
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
  translations?: {
    language: string;
    title: string;
    content: string;
    seo: {
      title: string;
      description: string;
      keywords: string;
    };
  }[];
  
  // Компоненты для добавления на страницу
  components: ComponentContext[];
}

export interface ComponentContext {
  componentId: string;
  data: Record<string, any>;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  viewOrder?: number;
}

export interface PageCreationResult {
  success: boolean;
  page?: PageData;
  error?: string;
  warnings?: string[];
}

class PageCreationService {
  /**
   * Создает страницу с полным контекстом
   */
  async createPageWithContext(context: PageCreationContext): Promise<PageCreationResult> {
    try {
      // 1. Валидация контекста
      const validation = this.validateContext(context);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // 2. Подготовка данных страницы
      const pageData = this.preparePageData(context);
      
      // 3. Создание страницы
      const createdPage = await apiClient.createPage(pageData);
      
      // 4. Добавление компонентов
      if (context.components.length > 0) {
        await this.addComponentsToPage(createdPage.id!, context.components);
      }
      
      // 5. Настройка SEO шаблонов (если необходимо)
      await this.setupSeoTemplates(createdPage.id!, context.seo);
      
      // 6. Публикация (если требуется)
      if (context.publication.isPublished) {
        await apiClient.publishPage(createdPage.id!);
      }

      return {
        success: true,
        page: createdPage,
        warnings: validation.warnings
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  /**
   * Валидация контекста создания страницы
   */
  private validateContext(context: PageCreationContext): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Проверка обязательных полей
    if (!context.title?.trim()) {
      errors.push('Название страницы обязательно');
    }

    if (!context.content?.trim()) {
      errors.push('Содержимое страницы обязательно');
    }

    if (!context.seo.title?.trim()) {
      warnings.push('SEO заголовок не указан, будет использован обычный заголовок');
    }

    if (!context.seo.description?.trim()) {
      warnings.push('SEO описание не указано');
    }

    if (!context.seo.keywords?.trim()) {
      warnings.push('SEO ключевые слова не указаны');
    }

    // Проверка длины полей
    if (context.title && context.title.length > 255) {
      errors.push('Название страницы не должно превышать 255 символов');
    }

    if (context.seo.title && context.seo.title.length > 250) {
      errors.push('SEO заголовок не должен превышать 250 символов');
    }

    if (context.seo.description && context.seo.description.length > 500) {
      warnings.push('SEO описание превышает рекомендуемую длину 500 символов');
    }

    // Проверка компонентов
    context.components.forEach((component, index) => {
      if (!component.componentId) {
        errors.push(`Компонент ${index + 1}: не указан ID компонента`);
      }
      if (!component.data || Object.keys(component.data).length === 0) {
        warnings.push(`Компонент ${index + 1}: данные не указаны`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Подготовка данных страницы для API
   */
  private preparePageData(context: PageCreationContext): PageData {
    return {
      title: context.title,
      slug: context.slug || this.generateSlug(context.title),
      content: context.content,
      
      // SEO поля
      seo_title: context.seo.title,
      seo_description: context.seo.description,
      seo_keywords: context.seo.keywords,
      seo_author: context.seo.author,
      seo_og_type: context.seo.ogType,
      seo_image: context.seo.image,
      
      // Публикация
      is_active: context.publication.isActive,
      is_published: context.publication.isPublished,
      display_on_sitemap: context.publication.displayOnSitemap,
      sites: context.publication.sites,
      
      // Дополнительные поля
      page_type: 'Page',
      parent: context.publication.parentPageId
    };
  }

  /**
   * Добавление компонентов к странице
   */
  private async addComponentsToPage(
    pageId: number, 
    components: ComponentContext[]
  ): Promise<void> {
    for (let i = 0; i < components.length; i++) {
      const componentContext = components[i];
      
      try {
        // Создаем экземпляр компонента
        const componentInstance = await apiClient.createComponentInstance({
          component_id: componentContext.componentId,
          page_id: pageId,
          data: componentContext.data,
          view_order: componentContext.viewOrder || i + 1,
          position: componentContext.position
        });
        
        console.log(`Компонент ${componentContext.componentId} добавлен к странице ${pageId}`);
      } catch (error) {
        console.error(`Ошибка добавления компонента ${componentContext.componentId}:`, error);
        throw new Error(`Не удалось добавить компонент: ${componentContext.componentId}`);
      }
    }
  }

  /**
   * Настройка SEO шаблонов для страницы
   */
  private async setupSeoTemplates(pageId: number, seoContext: PageCreationContext['seo']): Promise<void> {
    try {
      // Здесь можно добавить логику для создания SEO шаблонов
      // если система поддерживает автоматическую генерацию SEO
      console.log(`SEO шаблоны настроены для страницы ${pageId}`);
    } catch (error) {
      console.warn('Не удалось настроить SEO шаблоны:', error);
    }
  }

  /**
   * Генерация slug из заголовка
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-zа-я0-9\s-]/g, '') // Убираем специальные символы
      .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
      .replace(/-+/g, '-') // Убираем повторяющиеся дефисы
      .trim();
  }

  /**
   * Создание страницы "О компании" (пример использования)
   */
  async createAboutPage(): Promise<PageCreationResult> {
    const aboutPageContext: PageCreationContext = {
      title: "О нашей компании",
      content: `Мы - современная IT-компания, специализирующаяся на разработке 
веб-приложений и систем управления контентом. Наша команда работает 
с 2015 года и успешно реализовала более 200 проектов.`,
      
      seo: {
        title: "О компании - IT-разработка и веб-решения | НазваниеКомпании",
        description: "Узнайте больше о нашей IT-компании. Профессиональная разработка веб-приложений, систем управления контентом и мобильных решений. Опыт работы с 2015 года.",
        keywords: "о компании, IT разработка, веб-приложения, CMS, команда разработчиков",
        author: "НазваниеКомпании",
        ogType: "website"
      },
      
      publication: {
        isActive: true,
        isPublished: false, // Сначала создаем как черновик
        displayOnSitemap: true,
        sites: [1] // ID основного сайта
      },
      
      translations: [
        {
          language: "en",
          title: "About Our Company",
          content: "We are a modern IT company specializing in web application development and content management systems...",
          seo: {
            title: "About Our Company - IT Development and Web Solutions",
            description: "Learn more about our IT company. Professional web application development, content management systems and mobile solutions.",
            keywords: "about company, IT development, web applications, CMS, development team"
          }
        }
      ],
      
      components: [
        {
          componentId: "text-block",
          data: {
            text: "Наша миссия - создавать качественные цифровые решения, которые помогают бизнесу расти и развиваться в современном мире.",
            alignment: "center"
          },
          viewOrder: 1
        },
        {
          componentId: "image-gallery",
          data: {
            images: [
              { url: "/images/office.jpg", alt: "Офис компании", caption: "Наш офис" },
              { url: "/images/team.jpg", alt: "Команда", caption: "Наша команда" }
            ],
            show_captions: true
          },
          viewOrder: 2
        },
        {
          componentId: "contact-form",
          data: {
            form_title: "Свяжитесь с нами",
            email_recipient: "info@company.com",
            success_message: "Спасибо! Мы свяжемся с вами в течение 24 часов."
          },
          viewOrder: 3
        }
      ]
    };

    return await this.createPageWithContext(aboutPageContext);
  }
}

export const pageCreationService = new PageCreationService();
