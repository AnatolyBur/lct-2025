// API клиент для работы с GarpixCMS бэкендом

import type { PageMetadata, PageData, Component, ComponentInstance, ComponentMetadata, Layout, PageLayout } from '$lib/types/page';
import type { FormBuilderConfig, FormEvent, FormSubmission, FormEventLog, FormSubmitResponse } from '$lib/types/formBuilder';

// Конфигурация серверов
const SERVERS = {
  MOCK: import.meta.env.VITE_MOCK_SERVER_URL || 'http://localhost:3001/api',
  // Важно: реальный сервер должен включать префикс /api, т.к. Django отдает admin API под settings.API_URL
  REAL: import.meta.env.VITE_REAL_SERVER_URL || 'http://localhost:8000/api'
} as const;

type ServerType = keyof typeof SERVERS;

// Определяем какой сервер использовать (можно изменить через переменную окружения)
const getServerUrl = (): string => {
  const serverType = import.meta.env.VITE_API_SERVER as ServerType || 'MOCK';
  return SERVERS[serverType] || SERVERS.MOCK;
};

class ApiClient {
  private baseUrl: string;
  private serverType: ServerType;

  constructor(baseUrl?: string, serverType?: ServerType) {
    this.serverType = serverType || (import.meta.env.VITE_API_SERVER as ServerType) || 'MOCK';
    this.baseUrl = baseUrl || getServerUrl();
  }

  // Метод для переключения сервера
  setServer(serverType: ServerType): void {
    this.serverType = serverType;
    this.baseUrl = SERVERS[serverType];
  }

  // Получить текущий тип сервера
  getCurrentServer(): ServerType {
    return this.serverType;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'object') {
          // Если это объект с ошибками валидации
          const validationErrors = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMessage = `Ошибки валидации: ${validationErrors}`;
          
          // Сохраняем оригинальные ошибки для более детальной обработки
          const errorWithValidation = new Error(errorMessage);
          (errorWithValidation as any).validationErrors = errorData;
          throw errorWithValidation;
        }
      } catch (e) {
        // Если не удалось распарсить JSON, используем стандартное сообщение
        throw new Error(errorMessage);
      }
    }

    const data = await response.json();
    return data;
  }

  // Отдельный метод для DELETE запросов, которые не возвращают JSON
  private async deleteRequest(endpoint: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, method: 'DELETE' });
    
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch (e) {
        // Если не удалось распарсить JSON, используем стандартное сообщение
      }
      
      throw new Error(errorMessage);
    }
    
    // Для DELETE запросов не пытаемся парсить JSON
  }

  // Получение метаданных модели страницы
  async getPageMetadata(pageId?: number): Promise<PageMetadata> {
    const endpoint = pageId ? `/admin/pages/${pageId}/metadata/` : '/admin/pages/metadata/';
    const response = await this.request<{metadata: PageMetadata}>(endpoint);
    
    // Если это запрос для создания новой страницы (без pageId), 
    // нужно получить метаданные для модели по умолчанию
    if (!pageId && response.metadata.available_page_types) {
      const defaultModel = response.metadata.available_page_types.find(
        model => model.model_name === response.metadata.default_model
      );
      
      if (defaultModel) {
        return {
          fields: defaultModel.fields,
          translation: defaultModel.translation,
          available_page_types: response.metadata.available_page_types,
          default_model: response.metadata.default_model
        };
      }
    }
    
    return response.metadata;
  }

  // Получение доступных типов страниц
  async getAvailablePageTypes(): Promise<Array<{model_name: string, verbose_name: string, fields: any[], translation: any}>> {
    const response = await this.request<{metadata: PageMetadata}>('/admin/pages/metadata/');
    return response.metadata.available_page_types || [];
  }

  // Получение списка страниц
  async getPages(query?: { q?: string; exclude?: number }): Promise<PageData[]> {
    let endpoint = '/admin/pages/';
    if (query && (query.q || query.exclude !== undefined)) {
      const params = new URLSearchParams();
      if (query.q) params.set('q', query.q);
      if (query.exclude !== undefined) params.set('exclude', String(query.exclude));
      endpoint = `${endpoint}?${params.toString()}`;
    }
    return this.request<PageData[]>(endpoint);
  }

  // Получение конкретной страницы
  async getPage(id: number): Promise<PageData> {
    return this.request<PageData>(`/admin/pages/${id}/`);
  }

  // Создать или получить черновик страницы
  async draftPage(id: number): Promise<PageData> {
    return this.request<PageData>(`/admin/pages/${id}/draft/`, {
      method: 'POST'
    });
  }

  // Получить черновик страницы, если существует
  async getPageDraft(id: number): Promise<PageData> {
    return this.request<PageData>(`/admin/pages/${id}/draft/`, {
      method: 'GET'
    });
  }

  // Опубликовать черновик (по id оригинала или черновика)
  async publishPage(id: number): Promise<PageData> {
    return this.request<PageData>(`/admin/pages/${id}/publish/`, {
      method: 'POST'
    });
  }

  // Создание новой страницы
  async createPage(data: PageData): Promise<PageData> {
    // Добавляем тип страницы по умолчанию, если не указан
    const pageData = {
      ...data,
      page_type: data.page_type || 'Page'
    };
    
    // Если поле sites не передано, добавляем первый сайт
    if (!pageData.sites || pageData.sites.length === 0) {
      try {
        const siteInfo = await this.getSiteBaseUrl();
        // Предполагаем, что первый сайт имеет ID = 1 (стандартное поведение Django)
        pageData.sites = [1];
      } catch (error) {
        console.warn('Не удалось получить информацию о сайте, используем первый сайт по умолчанию:', error);
        pageData.sites = [1];
      }
    }
    
    console.log('Отправляем данные для создания страницы:', pageData);
    console.log('Тип страницы:', pageData.page_type);
    
    const result = await this.request<PageData>('/admin/pages/', {
      method: 'POST',
      body: JSON.stringify(pageData),
    });
    
    console.log('Страница успешно создана:', result);
    return result;
  }

  // Обновление страницы
  async updatePage(id: number, data: PageData): Promise<PageData> {
    // Если поле sites не передано, добавляем первый сайт
    const pageData = { ...data };
    if (!pageData.sites || pageData.sites.length === 0) {
      try {
        const siteInfo = await this.getSiteBaseUrl();
        // Предполагаем, что первый сайт имеет ID = 1 (стандартное поведение Django)
        pageData.sites = [1];
      } catch (error) {
        console.warn('Не удалось получить информацию о сайте, используем первый сайт по умолчанию:', error);
        pageData.sites = [1];
      }
    }
    
    console.log(`Отправляем данные для обновления страницы ${id}:`, pageData);
    
    const result = await this.request<PageData>(`/admin/pages/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(pageData),
    });
    
    console.log(`Страница ${id} успешно обновлена:`, result);
    return result;
  }

  // Удаление страницы
  async deletePage(id: number): Promise<void> {
    await this.deleteRequest(`/admin/pages/${id}/`);
  }

  // Получение доступных компонентов
  async getComponents(): Promise<Component[]> {
    return this.request<Component[]>('/admin/components/');
  }

  // Получение метаданных компонента
  async getComponentMetadata(componentId: string): Promise<Component> {
    return this.request<Component>(`/admin/components/${componentId}/metadata/`);
  }

  // Получение метаданных всех доступных типов компонентов
  async getAllComponentsMetadata(): Promise<Array<{model_name: string, app_label: string, verbose_name: string, fields: any[]}>> {
    const resp = await this.request<{components_metadata: Array<{model_name: string, app_label: string, verbose_name: string, fields: any[]}>}>(`/admin/components/metadata/`);
    return resp.components_metadata || [];
  }

  // === Методы для работы с раскладками ===

  // Получение списка доступных раскладок
  async getLayouts(): Promise<Layout[]> {
    return this.request<Layout[]>('/admin/layouts/');
  }

  // Получение конкретной раскладки
  async getLayout(id: string): Promise<Layout> {
    return this.request<Layout>(`/admin/layouts/${id}/`);
  }

  // Создание новой раскладки
  async createLayout(data: Layout): Promise<Layout> {
    return this.request<Layout>('/admin/layouts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Обновление раскладки
  async updateLayout(id: string, data: Layout): Promise<Layout> {
    return this.request<Layout>(`/admin/layouts/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Удаление раскладки
  async deleteLayout(id: string): Promise<void> {
    await this.deleteRequest(`/admin/layouts/${id}/`);
  }

  // Получение раскладки страницы
  async getPageLayout(pageId: number): Promise<PageLayout | null> {
    return this.request<PageLayout | null>(`/admin/pages/${pageId}/layout/`);
  }

  // Установка раскладки для страницы
  async setPageLayout(pageId: number, layoutId: string, customZones?: any): Promise<PageLayout> {
    return this.request<PageLayout>(`/admin/pages/${pageId}/layout/`, {
      method: 'POST',
      body: JSON.stringify({ layout_id: layoutId, custom_zones: customZones }),
    });
  }

  // Обновление раскладки страницы
  async updatePageLayout(pageId: number, pageLayout: PageLayout): Promise<PageLayout> {
    return this.request<PageLayout>(`/admin/pages/${pageId}/layout/`, {
      method: 'PUT',
      body: JSON.stringify(pageLayout),
    });
  }

  // === Методы для работы с экземплярами компонентов ===

  // Получение списка экземпляров компонентов
  async getComponentInstances(pageId?: number): Promise<ComponentInstance[]> {
    const url = pageId 
      ? `/admin/component-instances/?page=${pageId}`
      : '/admin/component-instances/';
    return this.request<ComponentInstance[]>(url);
  }

  // Получение конкретного экземпляра компонента
  async getComponentInstance(id: string): Promise<ComponentInstance> {
    return this.request<ComponentInstance>(`/admin/component-instances/${id}/`);
  }

  // Создание нового компонента (с привязкой к странице, если указан pageId)
  async createComponent(componentType: string, data: Record<string, any>, pageId?: number, viewOrder?: number): Promise<Component> {
    return this.request<Component>('/admin/components/', {
      method: 'POST',
      body: JSON.stringify({ 
        component_type: componentType,
        page_id: pageId,
        view_order: viewOrder,
        ...data
      }),
    });
  }

  // Создание экземпляра из существующего компонента и (опционально) привязка к странице
  async createComponentInstanceFromExisting(componentId: string, pageId?: number, viewOrder?: number, copy: boolean = true): Promise<ComponentInstance> {
    return this.request<ComponentInstance>('/admin/component-instances/', {
      method: 'POST',
      body: JSON.stringify({
        component_id: componentId,
        page_id: pageId,
        view_order: viewOrder,
        copy
      }),
    });
  }

  // Обновление экземпляра компонента
  async updateComponentInstance(id: string, data: Record<string, any>): Promise<ComponentInstance> {
    return this.request<ComponentInstance>(`/admin/component-instances/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ data }),
    });
  }

  // Удаление экземпляра компонента
  async deleteComponentInstance(id: string): Promise<void> {
    await this.deleteRequest(`/admin/component-instances/${id}/`);
  }

  // Обновление порядка компонентов страницы
  async reorderPageComponents(pageId: number, components: Array<{id: string; view_order?: number}>): Promise<{success: boolean; message: string; components: any[]}> {
    return this.request<{success: boolean; message: string; components: any[]}>(`/admin/pages/${pageId}/components/reorder/`, {
      method: 'PATCH',
      body: JSON.stringify({ components })
    });
  }

  // Получение базового URL сайта
  async getSiteBaseUrl(): Promise<{base_url: string, domain: string}> {
    return this.request<{base_url: string, domain: string}>('/admin/site/base-url/');
  }

  // === Методы для работы с формами ===

  // Получить список всех форм
  async getForms(): Promise<FormBuilderConfig[]> {
    return this.request<FormBuilderConfig[]>('/admin/forms/');
  }

  // Получить конфигурацию конкретной формы
  async getFormConfig(formId: number): Promise<FormBuilderConfig> {
    const url = `/admin/forms/${formId}/config/`;
    console.log('Запрос формы с ID:', formId, 'URL:', url);
    return this.request<FormBuilderConfig>(url);
  }

  // Создать новую форму
  async createForm(formData: Partial<FormBuilderConfig>): Promise<FormBuilderConfig> {
    return this.request<FormBuilderConfig>('/admin/forms/', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  }

  // Обновить существующую форму
  async updateForm(formId: number, formData: Partial<FormBuilderConfig>): Promise<FormBuilderConfig> {
    return this.request<FormBuilderConfig>(`/admin/forms/${formId}/config/`, {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  }

  // Удалить форму
  async deleteForm(formId: number): Promise<void> {
    await this.deleteRequest(`/admin/forms/${formId}/config/`);
  }

  // Отправить форму (публичный API)
  async submitForm(formId: number, formData: Record<string, any>): Promise<FormSubmitResponse> {
    return this.request<FormSubmitResponse>(`/forms/${formId}/submit/`, {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  }

  // === Методы для работы с событиями форм ===

  // Получить события формы
  async getFormEvents(formId: number): Promise<FormEvent[]> {
    return this.request<FormEvent[]>(`/admin/forms/${formId}/events/`);
  }

  // Создать событие формы
  async createFormEvent(formId: number, eventData: Partial<FormEvent>): Promise<FormEvent> {
    return this.request<FormEvent>(`/admin/forms/${formId}/events/`, {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }

  // Получить конкретное событие
  async getFormEvent(formId: number, eventId: number): Promise<FormEvent> {
    return this.request<FormEvent>(`/admin/forms/${formId}/events/${eventId}/`);
  }

  // Обновить событие формы
  async updateFormEvent(formId: number, eventId: number, eventData: Partial<FormEvent>): Promise<FormEvent> {
    return this.request<FormEvent>(`/admin/forms/${formId}/events/${eventId}/`, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    });
  }

  // Удалить событие формы
  async deleteFormEvent(formId: number, eventId: number): Promise<void> {
    await this.deleteRequest(`/admin/forms/${formId}/events/${eventId}/`);
  }

  // === Методы для работы с отправками форм ===

  // Получить отправки формы
  async getFormSubmissions(formId: number): Promise<FormSubmission[]> {
    return this.request<FormSubmission[]>(`/admin/forms/${formId}/submissions/`);
  }

  // Получить логи событий формы
  async getFormEventLogs(formId: number, eventId?: number): Promise<FormEventLog[]> {
    const endpoint = eventId 
      ? `/admin/forms/${formId}/events/${eventId}/logs/`
      : `/admin/forms/${formId}/events/logs/`;
    return this.request<FormEventLog[]>(endpoint);
  }

}

// Экспорт типов для использования в других файлах
export type { ServerType };

// Основной экземпляр клиента (использует настройки по умолчанию)
export const apiClient = new ApiClient();

// Дополнительные экземпляры для разных серверов
export const mockApiClient = new ApiClient(SERVERS.MOCK, 'MOCK');
export const realApiClient = new ApiClient(SERVERS.REAL, 'REAL');

// Утилитарные функции для переключения сервера
export const switchToMockServer = () => apiClient.setServer('MOCK');
export const switchToRealServer = () => apiClient.setServer('REAL');
