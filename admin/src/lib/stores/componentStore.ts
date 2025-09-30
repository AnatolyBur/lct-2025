// Store для управления состоянием компонентов
import { writable, derived, get } from 'svelte/store';
import type { Component, ComponentInstance, ComponentMetadata, BasePageField } from '$lib/types/page';
import { apiClient } from '$lib/api/client';

// Функция для получения человеко-читаемого названия поля
function getFieldDisplayName(fields: BasePageField[], fieldKey: string): string {
  // Сначала ищем в полях компонента
  const field = fields?.find(f => f.name === fieldKey);
  
  // Используем help_text как человеко-читаемое название поля
  if (field?.help_text) {
    return field.help_text;
  }
  
  // Если нет help_text, пробуем verbose_name как fallback
  if (field?.verbose_name) {
    return field.verbose_name;
  }
  
  // Если не найдено, возвращаем ключ с заглавной буквы
  return fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/_/g, ' ');
}

// Функция для обогащения данных компонента человеко-читаемыми названиями полей
function enrichComponentData(instance: ComponentInstance): ComponentInstance {
  if (!instance.data || !instance.component.fields) {
    return instance;
  }

  // Создаем объект с человеко-читаемыми названиями полей
  const enrichedData: Record<string, any> = {};
  const fieldDisplayNames: Record<string, string> = {};

  // Обрабатываем основные данные компонента
  Object.entries(instance.data).forEach(([key, value]) => {
    enrichedData[key] = value;
    fieldDisplayNames[key] = getFieldDisplayName(instance.component.fields, key);
  });

  // Если есть вложенный объект (например, component.data.object), обрабатываем и его
  if (instance.data.object && typeof instance.data.object === 'object') {
    const enrichedObject: Record<string, any> = {};
    Object.entries(instance.data.object).forEach(([key, value]) => {
      enrichedObject[key] = value;
      fieldDisplayNames[key] = getFieldDisplayName(instance.component.fields, key);
    });
    enrichedData.object = enrichedObject;
  }

  return {
    ...instance,
    data: enrichedData,
    // Добавляем поле с человеко-читаемыми названиями
    fieldDisplayNames
  };
}

// Состояние загрузки
export const componentLoading = writable(false);
export const componentError = writable<string | null>(null);

// Флаги для предотвращения повторных загрузок
let componentsLoading = false;
let componentInstancesLoading = false;

// Уведомления
export const componentNotification = writable<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  show: boolean;
} | null>(null);

// Доступные типы компонентов
export const availableComponents = writable<Component[]>([]);

// Экземпляры компонентов
export const componentInstances = writable<ComponentInstance[]>([]);

// Текущий редактируемый компонент
export const currentComponent = writable<ComponentInstance | null>(null);

// Метаданные текущего компонента
export const currentComponentMetadata = writable<ComponentMetadata | null>(null);

// Режим редактирования (create | edit | view)
export const componentEditMode = writable<'create' | 'edit' | 'view'>('view');

// Выбранный компонент для добавления
export const selectedComponentType = writable<Component | null>(null);

// Действия для работы с компонентами
export const componentActions = {
  // Загрузка доступных типов компонентов
  async loadAvailableComponents() {
    // Если компоненты уже загружены, не загружаем повторно
    if (get(availableComponents).length > 0) {
      return;
    }

    // Предотвращаем повторные вызовы
    if (componentsLoading) {
      return;
    }

    try {
      componentsLoading = true;
      componentLoading.set(true);
      componentError.set(null);
      
      const components = await apiClient.getComponents();
      availableComponents.set(components);
    } catch (err) {
      componentError.set(err instanceof Error ? err.message : 'Ошибка загрузки компонентов');
    } finally {
      componentsLoading = false;
      componentLoading.set(false);
    }
  },

  // Загрузка метаданных компонента
  async loadComponentMetadata(componentId: string) {
    try {
      componentLoading.set(true);
      componentError.set(null);
      
      const metadata = await apiClient.getComponentMetadata(componentId);
      // Преобразуем Component в ComponentMetadata
      const componentMetadata: ComponentMetadata = {
        fields: metadata.fields,
        component_name: metadata.name,
        component_type: metadata.component_type || metadata.type,
        config: metadata.config
      };
      currentComponentMetadata.set(componentMetadata);
      
      return componentMetadata;
    } catch (err) {
      componentError.set(err instanceof Error ? err.message : 'Ошибка загрузки метаданных компонента');
      throw err;
    } finally {
      componentLoading.set(false);
    }
  },

  // Загрузка экземпляров компонентов
  async loadComponentInstances(pageId?: number) {
    // Предотвращаем повторные вызовы
    if (componentInstancesLoading) {
      return;
    }

    try {
      componentInstancesLoading = true;
      componentLoading.set(true);
      componentError.set(null);
      
      const instances = await apiClient.getComponentInstances(pageId);
      // Обогащаем данные компонентов человеко-читаемыми названиями полей
      const enrichedInstances = instances.map(enrichComponentData);
      componentInstances.set(enrichedInstances);
    } catch (err) {
      componentError.set(err instanceof Error ? err.message : 'Ошибка загрузки экземпляров компонентов');
    } finally {
      componentInstancesLoading = false;
      componentLoading.set(false);
    }
  },

  // Загрузка конкретного экземпляра компонента
  async loadComponentInstance(id: string) {
    try {
      componentLoading.set(true);
      componentError.set(null);
      const instance = await apiClient.getComponentInstance(id);
      console.log('📥 Store: Загружен экземпляр компонента', instance);
      
      // Обогащаем данные компонента
      const enrichedInstance = enrichComponentData(instance);
      currentComponent.set(enrichedInstance);
      componentEditMode.set('edit');
      
      // Загружаем метаданные для этого компонента
      const metadata = await this.loadComponentMetadata(instance.component_id);
      console.log('📥 Store: Загружены метаданные компонента', metadata);
    } catch (err) {
      componentError.set(err instanceof Error ? err.message : 'Ошибка загрузки экземпляра компонента');
    } finally {
      componentLoading.set(false);
    }
  },

  // Создание нового компонента
  async createComponent(componentType: string, data: Record<string, any>, options?: { pageId?: number; viewOrder?: number }) {
    try {
      componentLoading.set(true);
      componentError.set(null);
      const newComponent = await apiClient.createComponent(componentType, data, options?.pageId, options?.viewOrder);
      
      // Если указан pageId, перезагружаем список экземпляров компонентов для страницы
      if (options?.pageId) {
        await this.loadComponentInstances(options.pageId);
      }
      
      // Показываем уведомление об успехе
      this.showNotification('success', 'Компонент успешно создан!');
      
      return newComponent;
    } catch (err) {
      componentError.set(err instanceof Error ? err.message : 'Ошибка создания компонента');
      throw err;
    } finally {
      componentLoading.set(false);
    }
  },

  // Добавить существующий компонент на страницу (создает инстанс из уже созданного)
  async addExistingComponentToPage(componentId: string, options?: { pageId?: number; viewOrder?: number; copy?: boolean }) {
    try {
      componentLoading.set(true);
      componentError.set(null);
      const instance = await apiClient.createComponentInstanceFromExisting(componentId, options?.pageId, options?.viewOrder, options?.copy ?? true);
      // Если указан pageId, перезагружаем список экземпляров компонентов для страницы
      if (options?.pageId) {
        await this.loadComponentInstances(options.pageId);
      } else {
        // иначе просто добавим в список
        componentInstances.update(list => [instance, ...list]);
      }
      this.showNotification('success', options?.copy === false ? 'Компонент привязан к странице' : 'Компонент скопирован и добавлен на страницу');
      return instance;
    } catch (err) {
      componentError.set(err instanceof Error ? err.message : 'Ошибка добавления компонента');
      throw err;
    } finally {
      componentLoading.set(false);
    }
  },

  // Обновление экземпляра компонента
  async updateComponentInstance(id: string, data: Record<string, any>) {
    try {
      componentLoading.set(true);
      componentError.set(null);
      const updatedInstance = await apiClient.updateComponentInstance(id, data);
      
      // Обновляем список экземпляров
      componentInstances.update(instances => 
        instances.map(instance => String(instance.id) === String(id) ? updatedInstance : instance)
      );
      
      // Обновляем текущий компонент
      currentComponent.set(updatedInstance);
      
      // Показываем уведомление об успехе
      this.showNotification('success', 'Компонент успешно обновлен!');
      
      return updatedInstance;
    } catch (err) {
      componentError.set(err instanceof Error ? err.message : 'Ошибка обновления компонента');
      throw err;
    } finally {
      componentLoading.set(false);
    }
  },

  // Удаление экземпляра компонента
  async deleteComponentInstance(id: string) {
    try {
      componentLoading.set(true);
      componentError.set(null);
      await apiClient.deleteComponentInstance(id);
      
      // Удаляем из списка экземпляров
      componentInstances.update(instances => instances.filter(instance => String(instance.id) !== String(id)));
      
      // Если удаляемый компонент был текущим, очищаем состояние
      currentComponent.update(instance => String(instance?.id ?? '') === String(id) ? null : instance);
      
      if (currentComponent) {
        componentEditMode.set('view');
      }
      
      // Показываем уведомление об успехе
      this.showNotification('success', 'Компонент успешно удален!');
    } catch (err) {
      componentError.set(err instanceof Error ? err.message : 'Ошибка удаления компонента');
      throw err;
    } finally {
      componentLoading.set(false);
    }
  },


  // Переход в режим создания нового компонента
  startCreate(componentType?: Component) {
    currentComponent.set(null);
    componentEditMode.set('create');
    selectedComponentType.set(componentType || null);
    componentError.set(null);
  },

  // Переход в режим просмотра
  startView() {
    componentEditMode.set('view');
    componentError.set(null);
  },

  // Обновление порядка компонентов страницы
  async reorderPageComponents(pageId: number, components: ComponentInstance[]) {
    try {
      componentLoading.set(true);
      componentError.set(null);
      
      console.log('🔄 Store: Начинаем обновление порядка компонентов', {
        pageId,
        componentsCount: components.length,
        components: components.map(c => ({ id: c.id, title: c.component.name }))
      });
      
      // Подготавливаем данные для API
      const componentsData = components.map((component, index) => ({
        id: String(component.component_id || component.id),
        view_order: index + 1
      }));
      
      console.log('📤 Store: Отправляем данные на сервер', componentsData);
      
      const result = await apiClient.reorderPageComponents(pageId, componentsData);
      
      console.log('📥 Store: Получен ответ от сервера', result);
      
      // Обновляем локальное состояние по ответу сервера (актуальные view_order)
      const idToOrder = new Map<string, number>(
        (result.components || []).map(c => [String(c.id), Number(c.view_order) || 0])
      );
      const updatedComponents = components.map(c => ({
        ...c,
        view_order: idToOrder.get(String(c.component_id || c.id)) ?? c.view_order ?? 0,
      }));
      // Сортируем по view_order для немедленного визуального применения
      updatedComponents.sort((a, b) => (a.view_order ?? 0) - (b.view_order ?? 0));
      componentInstances.set(updatedComponents);
      
      // Показываем уведомление об успехе
      this.showNotification('success', 'Порядок компонентов успешно обновлен!');
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления порядка компонентов';
      console.error('❌ Store: Ошибка обновления порядка компонентов', err);
      componentError.set(errorMessage);
      this.showNotification('error', errorMessage);
      throw err;
    } finally {
      componentLoading.set(false);
    }
  },

  // Очистка ошибок
  clearError() {
    componentError.set(null);
  },

  // Показать уведомление
  showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string) {
    componentNotification.set({ type, message, show: true });
  },

  // Скрыть уведомление
  hideNotification() {
    componentNotification.set(null);
  },

  // Принудительная перезагрузка компонентов
  async reloadComponents() {
    componentsLoading = false;
    availableComponents.set([]);
    await this.loadAvailableComponents();
  },

  // Получение компонентов по типу
  getComponentsByType(type: string): Component[] {
    return get(availableComponents).filter(component => component.type === type);
  }
};

// Производные store для удобства
export const isCreatingComponent = derived(componentEditMode, $editMode => $editMode === 'create');
export const isEditingComponent = derived(componentEditMode, $editMode => $editMode === 'edit');
export const isViewingComponent = derived(componentEditMode, $editMode => $editMode === 'view');
export const hasCurrentComponent = derived(currentComponent, $currentComponent => $currentComponent !== null);
