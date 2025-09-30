// Store для управления состоянием раскладок
import { writable, derived, get } from 'svelte/store';
import type { Layout, PageLayout, LayoutZone, LayoutComponent } from '$lib/types/page';
import { apiClient } from '$lib/api/client';

// Состояние загрузки
export const layoutLoading = writable(false);
export const layoutError = writable<string | null>(null);

// Флаги для предотвращения повторных загрузок
let layoutsLoading = false;

// Уведомления
export const layoutNotification = writable<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  show: boolean;
} | null>(null);

// Список доступных раскладок
export const layouts = writable<Layout[]>([]);

// Текущая редактируемая раскладка
export const currentLayout = writable<Layout | null>(null);

// Раскладка текущей страницы
export const currentPageLayout = writable<PageLayout | null>(null);

// Режим редактирования раскладки
export const layoutEditMode = writable<'create' | 'edit' | 'view'>('view');

// Действия для работы с раскладками
export const layoutActions = {
  // Загрузка списка раскладок
  async loadLayouts() {
    if (layoutsLoading) {
      return;
    }

    try {
      layoutsLoading = true;
      layoutLoading.set(true);
      layoutError.set(null);
      
      const layoutsList = await apiClient.getLayouts();
      layouts.set(layoutsList);
    } catch (err) {
      layoutError.set(err instanceof Error ? err.message : 'Ошибка загрузки раскладок');
    } finally {
      layoutsLoading = false;
      layoutLoading.set(false);
    }
  },

  // Загрузка конкретной раскладки
  async loadLayout(id: string) {
    try {
      layoutLoading.set(true);
      layoutError.set(null);
      const layout = await apiClient.getLayout(id);
      currentLayout.set(layout);
      layoutEditMode.set('edit');
    } catch (err) {
      layoutError.set(err instanceof Error ? err.message : 'Ошибка загрузки раскладки');
    } finally {
      layoutLoading.set(false);
    }
  },

  // Создание новой раскладки
  async createLayout(layoutData: Layout) {
    try {
      layoutLoading.set(true);
      layoutError.set(null);
      const newLayout = await apiClient.createLayout(layoutData);
      
      // Обновляем список раскладок
      layouts.update(layoutsList => [...layoutsList, newLayout]);
      
      // Переходим в режим редактирования новой раскладки
      currentLayout.set(newLayout);
      layoutEditMode.set('edit');
      
      this.showNotification('success', 'Раскладка успешно создана!');
      
      return newLayout;
    } catch (err) {
      layoutError.set(err instanceof Error ? err.message : 'Ошибка создания раскладки');
      throw err;
    } finally {
      layoutLoading.set(false);
    }
  },

  // Обновление раскладки
  async updateLayout(id: string, layoutData: Layout) {
    try {
      layoutLoading.set(true);
      layoutError.set(null);
      const updatedLayout = await apiClient.updateLayout(id, layoutData);
      
      // Обновляем список раскладок
      layouts.update(layoutsList => 
        layoutsList.map(layout => layout.id === id ? updatedLayout : layout)
      );
      
      // Обновляем текущую раскладку
      currentLayout.set(updatedLayout);
      
      this.showNotification('success', 'Раскладка успешно обновлена!');
      
      return updatedLayout;
    } catch (err) {
      layoutError.set(err instanceof Error ? err.message : 'Ошибка обновления раскладки');
      throw err;
    } finally {
      layoutLoading.set(false);
    }
  },

  // Удаление раскладки
  async deleteLayout(id: string) {
    try {
      layoutLoading.set(true);
      layoutError.set(null);
      await apiClient.deleteLayout(id);
      
      // Удаляем из списка раскладок
      layouts.update(layoutsList => layoutsList.filter(layout => layout.id !== id));
      
      // Если удаляемая раскладка была текущей, очищаем состояние
      currentLayout.update(layout => layout?.id === id ? null : layout);
      
      if (currentLayout) {
        layoutEditMode.set('view');
      }
      
      this.showNotification('success', 'Раскладка успешно удалена!');
    } catch (err) {
      layoutError.set(err instanceof Error ? err.message : 'Ошибка удаления раскладки');
      throw err;
    } finally {
      layoutLoading.set(false);
    }
  },

  // Загрузка раскладки страницы
  async loadPageLayout(pageId: number) {
    try {
      layoutLoading.set(true);
      layoutError.set(null);
      const pageLayout = await apiClient.getPageLayout(pageId);
      currentPageLayout.set(pageLayout);
    } catch (err) {
      layoutError.set(err instanceof Error ? err.message : 'Ошибка загрузки раскладки страницы');
    } finally {
      layoutLoading.set(false);
    }
  },

  // Установка раскладки для страницы
  async setPageLayout(pageId: number, layoutId: string, customZones?: LayoutZone[]) {
    try {
      layoutLoading.set(true);
      layoutError.set(null);
      const pageLayout = await apiClient.setPageLayout(pageId, layoutId, customZones);
      currentPageLayout.set(pageLayout);
      
      this.showNotification('success', 'Раскладка успешно применена к странице!');
      
      return pageLayout;
    } catch (err) {
      layoutError.set(err instanceof Error ? err.message : 'Ошибка применения раскладки к странице');
      throw err;
    } finally {
      layoutLoading.set(false);
    }
  },

  // Обновление раскладки страницы
  async updatePageLayout(pageId: number, pageLayout: PageLayout) {
    try {
      layoutLoading.set(true);
      layoutError.set(null);
      const updatedPageLayout = await apiClient.updatePageLayout(pageId, pageLayout);
      currentPageLayout.set(updatedPageLayout);
      
      this.showNotification('success', 'Раскладка страницы успешно обновлена!');
      
      return updatedPageLayout;
    } catch (err) {
      layoutError.set(err instanceof Error ? err.message : 'Ошибка обновления раскладки страницы');
      throw err;
    } finally {
      layoutLoading.set(false);
    }
  },

  // Переход в режим создания новой раскладки
  startCreateLayout() {
    currentLayout.set(null);
    layoutEditMode.set('create');
    layoutError.set(null);
  },

  // Переход в режим просмотра раскладки
  startViewLayout() {
    layoutEditMode.set('view');
    layoutError.set(null);
  },

  // Очистка ошибок
  clearLayoutError() {
    layoutError.set(null);
  },

  // Показать уведомление
  showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string) {
    layoutNotification.set({ type, message, show: true });
  },

  // Скрыть уведомление
  hideNotification() {
    layoutNotification.set(null);
  },

  // Принудительная перезагрузка раскладок
  async reloadLayouts() {
    layoutsLoading = false;
    layouts.set([]);
    await this.loadLayouts();
  }
};

// Производные store для удобства
export const isCreatingLayout = derived(layoutEditMode, $layoutEditMode => $layoutEditMode === 'create');
export const isEditingLayout = derived(layoutEditMode, $layoutEditMode => $layoutEditMode === 'edit');
export const isViewingLayout = derived(layoutEditMode, $layoutEditMode => $layoutEditMode === 'view');
export const hasCurrentLayout = derived(currentLayout, $currentLayout => $currentLayout !== null);
export const hasPageLayout = derived(currentPageLayout, $currentPageLayout => $currentPageLayout !== null);
