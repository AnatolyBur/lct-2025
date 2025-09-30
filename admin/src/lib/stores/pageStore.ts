// Store для управления состоянием страниц
import { writable, derived, get } from 'svelte/store';
import type { PageData, PageMetadata, Component } from '$lib/types/page';
import { apiClient } from '$lib/api/client';

// Состояние загрузки
export const loading = writable(false);
export const error = writable<string | null>(null);

// Флаги для предотвращения повторных загрузок
let metadataLoading = false;
let pagesLoading = false;

// Уведомления
export const notification = writable<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  show: boolean;
} | null>(null);

// Метаданные модели страницы
export const pageMetadata = writable<PageMetadata | null>(null);

// Доступные типы страниц
export const availablePageTypes = writable<Array<{model_name: string, verbose_name: string, fields: any[], translation: any}>>([]);

// Список страниц
export const pages = writable<PageData[]>([]);

// Текущая редактируемая страница
export const currentPage = writable<PageData | null>(null);

// Режим редактирования (create | edit | view)
export const editMode = writable<'create' | 'edit' | 'view'>('view');

// Компоненты
export const components = writable<Component[]>([]);

// Действия для работы со страницами
export const pageActions = {
  // Загрузка метаданных
  async loadMetadata() {
    // Если метаданные уже загружены, не загружаем повторно
    if (get(pageMetadata)) {
      return;
    }

    // Предотвращаем повторные вызовы
    if (metadataLoading) {
      return;
    }

    try {
      metadataLoading = true;
      loading.set(true);
      error.set(null);
      
      const metadata = await apiClient.getPageMetadata();
      pageMetadata.set(metadata);
      
      // Загружаем доступные типы страниц
      const pageTypes = await apiClient.getAvailablePageTypes();
      availablePageTypes.set(pageTypes);
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка загрузки метаданных');
    } finally {
      metadataLoading = false;
      loading.set(false);
    }
  },

  // Загрузка метаданных для конкретной страницы
  async loadPageMetadata(pageId: number) {
    try {
      loading.set(true);
      error.set(null);
      
      const metadata = await apiClient.getPageMetadata(pageId);
      pageMetadata.set(metadata);
      
      return metadata;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка загрузки метаданных страницы');
      throw err;
    } finally {
      loading.set(false);
    }
  },

  // Загрузка списка страниц
  async loadPages() {
    // Предотвращаем повторные вызовы
    if (pagesLoading) {
      return;
    }

    try {
      pagesLoading = true;
      loading.set(true);
      error.set(null);
      
      const pagesList = await apiClient.getPages();
      pages.set(pagesList);
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка загрузки страниц');
    } finally {
      pagesLoading = false;
      loading.set(false);
    }
  },

  // Загрузка конкретной страницы
  async loadPage(id: number) {
    try {
      loading.set(true);
      error.set(null);
      // Загружаем оригинальную страницу для редактирования
      const page = await apiClient.getPage(id);
      currentPage.set(page);
      editMode.set('edit');
      
      // Загружаем метаданные для этой конкретной страницы
      await this.loadPageMetadata(id);
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка загрузки страницы');
    } finally {
      loading.set(false);
    }
  },

  // Создание новой страницы
  async createPage(pageData: PageData) {
    try {
      loading.set(true);
      error.set(null);
      const newPage = await apiClient.createPage(pageData);
      
      // Обновляем список страниц
      pages.update(pagesList => [...pagesList, newPage]);
      
      // Переходим в режим редактирования новой страницы
      currentPage.set(newPage);
      editMode.set('edit');
      
      // Показываем уведомление об успехе
      this.showNotification('success', 'Страница успешно создана!');
      
      // Возвращаем ID для редиректа
      return newPage;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка создания страницы');
      throw err;
    } finally {
      loading.set(false);
    }
  },

  // Обновление страницы
  async updatePage(id: number, pageData: PageData) {
    try {
      loading.set(true);
      error.set(null);
      // Обновляем черновик (если редактируем черновик, у него будет свой id)
      const targetId = get(currentPage)?.id || id;
      const updatedPage = await apiClient.updatePage(targetId as number, pageData);
      
      // Обновляем список страниц
      pages.update(pagesList => 
        pagesList.map(page => page.id === id ? updatedPage : page)
      );
      
      // Обновляем текущую страницу
      currentPage.set(updatedPage);
      
      // Показываем уведомление об успехе
      this.showNotification('success', 'Страница успешно обновлена!');
      
      return updatedPage;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка обновления страницы');
      throw err;
    } finally {
      loading.set(false);
    }
  },

  // Сохранение как черновик
  async saveAsDraft(pageData: PageData) {
    try {
      loading.set(true);
      error.set(null);
      const page = get(currentPage);
      if (!page?.id) return;
      
      // Создаем черновик из текущих данных
      const draft = await apiClient.draftPage(page.id);
      // Обновляем черновик данными из формы
      const updatedDraft = await apiClient.updatePage(draft.id!, pageData);
      
      currentPage.set(updatedDraft);
      this.showNotification('success', 'Черновик сохранен');
      return updatedDraft;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка сохранения черновика');
      throw err;
    } finally {
      loading.set(false);
    }
  },

  // Публикация текущей страницы (черновика)
  async publishCurrentPage() {
    try {
      const page = get(currentPage);
      if (!page?.id) return;
      loading.set(true);
      error.set(null);
      const published = await apiClient.publishPage(page.id);
      currentPage.set(published);
      this.showNotification('success', 'Страница опубликована');
      return published;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка публикации страницы');
      throw err;
    } finally {
      loading.set(false);
    }
  },

  // Удаление страницы
  async deletePage(id: number) {
    try {
      loading.set(true);
      error.set(null);
      await apiClient.deletePage(id);
      
      // Удаляем из списка страниц
      pages.update(pagesList => pagesList.filter(page => page.id !== id));
      
      // Если удаляемая страница была текущей, очищаем состояние
      currentPage.update(page => page?.id === id ? null : page);
      
      if (currentPage) {
        editMode.set('view');
      }
      
      // Показываем уведомление об успехе
      this.showNotification('success', 'Страница успешно удалена!');
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка удаления страницы');
      throw err;
    } finally {
      loading.set(false);
    }
  },

  // Загрузка компонентов
  async loadComponents() {
    try {
      loading.set(true);
      error.set(null);
      const componentsList = await apiClient.getComponents();
      components.set(componentsList);
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка загрузки компонентов');
    } finally {
      loading.set(false);
    }
  },

  // Переход в режим создания новой страницы
  startCreate() {
    currentPage.set(null);
    editMode.set('create');
    error.set(null);
  },

  // Переход в режим просмотра
  startView() {
    editMode.set('view');
    error.set(null);
  },

  // Очистка ошибок
  clearError() {
    error.set(null);
  },

  // Показать уведомление
  showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string) {
    notification.set({ type, message, show: true });
  },

  // Скрыть уведомление
  hideNotification() {
    notification.set(null);
  },

  // Принудительная перезагрузка метаданных
  async reloadMetadata() {
    metadataLoading = false;
    pageMetadata.set(null);
    await this.loadMetadata();
  },

  // Загрузка метаданных для конкретного типа страницы
  async loadMetadataForPageType(pageType: string) {
    try {
      loading.set(true);
      error.set(null);
      
      const pageTypes = get(availablePageTypes);
      const selectedType = pageTypes.find(type => type.model_name === pageType);
      
      if (selectedType) {
        const metadata: PageMetadata = {
          fields: selectedType.fields,
          translation: selectedType.translation,
          model_name: selectedType.model_name,
          verbose_name: selectedType.verbose_name
        };
        pageMetadata.set(metadata);
      }
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка загрузки метаданных типа страницы');
    } finally {
      loading.set(false);
    }
  }
};

// Производные store для удобства
export const isCreating = derived(editMode, $editMode => $editMode === 'create');
export const isEditing = derived(editMode, $editMode => $editMode === 'edit');
export const isViewing = derived(editMode, $editMode => $editMode === 'view');
export const hasCurrentPage = derived(currentPage, $currentPage => $currentPage !== null);
