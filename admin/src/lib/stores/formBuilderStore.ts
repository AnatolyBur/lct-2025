// Store для управления состоянием конструктора форм
import { writable, derived, get } from 'svelte/store';
import type { 
  FormBuilderConfig, 
  FormBuilderField, 
  FormEvent, 
  FormSubmission, 
  FormEventLog,
  DragItem,
  FormBuilderState,
  FormBuilderActions
} from '$lib/types/formBuilder';
import { apiClient } from '$lib/api/client';

// Состояние загрузки
export const loading = writable(false);
export const error = writable<string | null>(null);

// Флаги для предотвращения повторных загрузок
let formsLoading = false;
let currentFormLoading = false;

// Уведомления
export const notification = writable<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  show: boolean;
} | null>(null);

// Основное состояние конструктора
export const currentForm = writable<FormBuilderConfig | null>(null);
export const forms = writable<FormBuilderConfig[]>([]);
export const selectedField = writable<FormBuilderField | null>(null);
export const dragItem = writable<DragItem | null>(null);
export const previewMode = writable(false);

// События формы
export const formEvents = writable<FormEvent[]>([]);
export const formSubmissions = writable<FormSubmission[]>([]);
export const formEventLogs = writable<FormEventLog[]>([]);

// Действия для работы с формами
export const formBuilderActions: FormBuilderActions = {
  // Загрузка списка форм
  async loadForms() {
    if (formsLoading) return;

    try {
      formsLoading = true;
      loading.set(true);
      error.set(null);
      
      const formsList = await apiClient.getForms();
      forms.set(formsList);
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка загрузки форм');
    } finally {
      formsLoading = false;
      loading.set(false);
    }
  },

  // Загрузка конкретной формы
  async loadForm(id: number) {
    if (currentFormLoading) return;

    try {
      currentFormLoading = true;
      loading.set(true);
      error.set(null);
      
      const form = await apiClient.getFormConfig(id);
      currentForm.set(form);
      
      // Загружаем события формы
      await this.loadFormEvents(id);
      
      return form;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка загрузки формы');
      throw err;
    } finally {
      currentFormLoading = false;
      loading.set(false);
    }
  },

  // Загрузка конкретной формы с обновлением списка форм
  async loadFormWithList(id: number) {
    await Promise.all([
      this.loadForm(id),
      this.loadForms()
    ]);
  },

  // Сохранение формы
  async saveForm(form: FormBuilderConfig) {
    try {
      loading.set(true);
      error.set(null);
      
      let savedForm: FormBuilderConfig;
      
      if (form.id) {
        // Обновление существующей формы
        savedForm = await apiClient.updateForm(form.id, form);
      } else {
        // Создание новой формы
        savedForm = await apiClient.createForm(form);
      }
      
      // Обновляем текущую форму
      currentForm.set(savedForm);
      
      // Обновляем список форм
      forms.update(formsList => {
        const existingIndex = formsList.findIndex(f => f.id === savedForm.id);
        if (existingIndex >= 0) {
          formsList[existingIndex] = savedForm;
        } else {
          formsList.push(savedForm);
        }
        return formsList;
      });
      
      this.showNotification('success', 'Форма успешно сохранена!');
      
      return savedForm;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка сохранения формы');
      throw err;
    } finally {
      loading.set(false);
    }
  },

  // Создание новой формы
  async createForm(formData: Partial<FormBuilderConfig>) {
    try {
      loading.set(true);
      error.set(null);
      
      const newForm = await apiClient.createForm(formData);
      
      // Обновляем список форм
      forms.update(formsList => [...formsList, newForm]);
      
      // Устанавливаем как текущую форму
      currentForm.set(newForm);
      
      this.showNotification('success', 'Форма успешно создана!');
      
      return newForm;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка создания формы');
      throw err;
    } finally {
      loading.set(false);
    }
  },

  // Удаление формы
  async deleteForm(id: number) {
    try {
      loading.set(true);
      error.set(null);
      
      await apiClient.deleteForm(id);
      
      // Удаляем из списка форм
      forms.update(formsList => formsList.filter(form => form.id !== id));
      
      // Если удаляемая форма была текущей, очищаем состояние
      currentForm.update(form => form?.id === id ? null : form);
      
      this.showNotification('success', 'Форма успешно удалена!');
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка удаления формы');
      throw err;
    } finally {
      loading.set(false);
    }
  },

  // Добавление поля в форму
  addField(field: FormBuilderField) {
    currentForm.update(form => {
      if (!form) return form;
      
      const updatedForm = { ...form };
      if (!updatedForm.form_config.fields) {
        updatedForm.form_config.fields = [];
      }
      
      updatedForm.form_config.fields.push(field);
      return updatedForm;
    });
  },

  // Обновление поля
  updateField(fieldId: string, updates: Partial<FormBuilderField>) {
    currentForm.update(form => {
      if (!form) return form;
      
      const updatedForm = { ...form };
      if (updatedForm.form_config.fields) {
        updatedForm.form_config.fields = updatedForm.form_config.fields.map(field =>
          field.id === fieldId ? { ...field, ...updates } : field
        );
      }
      
      return updatedForm;
    });
  },

  // Удаление поля
  removeField(fieldId: string) {
    currentForm.update(form => {
      if (!form) return form;
      
      const updatedForm = { ...form };
      if (updatedForm.form_config.fields) {
        updatedForm.form_config.fields = updatedForm.form_config.fields.filter(
          field => field.id !== fieldId
        );
      }
      
      return updatedForm;
    });
    
    // Если удаляемое поле было выбрано, снимаем выбор
    selectedField.update(field => field?.id === fieldId ? null : field);
  },

  // Переупорядочивание полей
  reorderFields(fieldIds: string[]) {
    currentForm.update(form => {
      if (!form) return form;
      
      const updatedForm = { ...form };
      if (updatedForm.form_config.fields) {
        const fieldsMap = new Map(updatedForm.form_config.fields.map(field => [field.id, field]));
        updatedForm.form_config.fields = fieldIds
          .map(id => fieldsMap.get(id))
          .filter(Boolean) as FormBuilderField[];
      }
      
      return updatedForm;
    });
  },

  // Выбор поля
  selectField(field: FormBuilderField | null) {
    selectedField.set(field);
  },

  // Установка элемента для перетаскивания
  setDragItem(item: DragItem | null) {
    dragItem.set(item);
  },

  // Переключение режима предварительного просмотра
  setPreviewMode(enabled: boolean) {
    previewMode.set(enabled);
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

  // Загрузка событий формы
  async loadFormEvents(formId: number) {
    try {
      const events = await apiClient.getFormEvents(formId);
      formEvents.set(events);
    } catch (err) {
      console.error('Ошибка загрузки событий формы:', err);
    }
  },

  // Создание события формы
  async createFormEvent(formId: number, eventData: Partial<FormEvent>) {
    try {
      const event = await apiClient.createFormEvent(formId, eventData);
      
      // Обновляем список событий
      formEvents.update(events => [...events, event]);
      
      this.showNotification('success', 'Событие успешно создано!');
      
      return event;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка создания события');
      throw err;
    }
  },

  // Обновление события формы
  async updateFormEvent(formId: number, eventId: number, eventData: Partial<FormEvent>) {
    try {
      const event = await apiClient.updateFormEvent(formId, eventId, eventData);
      
      // Обновляем список событий
      formEvents.update(events => 
        events.map(e => e.id === eventId ? event : e)
      );
      
      this.showNotification('success', 'Событие успешно обновлено!');
      
      return event;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка обновления события');
      throw err;
    }
  },

  // Удаление события формы
  async deleteFormEvent(formId: number, eventId: number) {
    try {
      await apiClient.deleteFormEvent(formId, eventId);
      
      // Удаляем из списка событий
      formEvents.update(events => events.filter(e => e.id !== eventId));
      
      this.showNotification('success', 'Событие успешно удалено!');
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Ошибка удаления события');
      throw err;
    }
  },

  // Загрузка отправок формы
  async loadFormSubmissions(formId: number) {
    try {
      const submissions = await apiClient.getFormSubmissions(formId);
      formSubmissions.set(submissions);
    } catch (err) {
      console.error('Ошибка загрузки отправок формы:', err);
    }
  },

  // Загрузка логов событий
  async loadFormEventLogs(formId: number, eventId?: number) {
    try {
      const logs = await apiClient.getFormEventLogs(formId, eventId);
      formEventLogs.set(logs);
    } catch (err) {
      console.error('Ошибка загрузки логов событий:', err);
    }
  }
};

// Производные store для удобства
export const isCreatingForm = derived(currentForm, $currentForm => !$currentForm?.id);
export const isEditingForm = derived(currentForm, $currentForm => !!$currentForm?.id);
export const hasCurrentForm = derived(currentForm, $currentForm => $currentForm !== null);
export const hasSelectedField = derived(selectedField, $selectedField => $selectedField !== null);
export const isDragging = derived(dragItem, $dragItem => $dragItem !== null);

// Производные для полей формы
export const formFields = derived(currentForm, $currentForm => 
  $currentForm?.form_config?.fields || []
);

export const selectedFieldIndex = derived(
  [currentForm, selectedField], 
  ([$currentForm, $selectedField]) => {
    if (!$currentForm || !$selectedField) return -1;
    return $currentForm.form_config.fields?.findIndex(field => field.id === $selectedField.id) ?? -1;
  }
);

// Производные для событий
export const activeFormEvents = derived(formEvents, $formEvents => 
  $formEvents.filter(event => event.is_active)
);

export const formEventsByType = derived(formEvents, $formEvents => {
  const eventsByType: Record<string, FormEvent[]> = {};
  $formEvents.forEach(event => {
    if (!eventsByType[event.event_type]) {
      eventsByType[event.event_type] = [];
    }
    eventsByType[event.event_type].push(event);
  });
  return eventsByType;
});

// Производные для статистики
export const formStats = derived(
  [currentForm, formSubmissions, formEventLogs],
  ([$currentForm, $formSubmissions, $formEventLogs]) => {
    if (!$currentForm) return null;
    
    const totalSubmissions = $formSubmissions.length;
    const successfulEvents = $formEventLogs.filter(log => log.status === 'success').length;
    const failedEvents = $formEventLogs.filter(log => log.status === 'error').length;
    
    return {
      totalSubmissions,
      successfulEvents,
      failedEvents,
      successRate: totalSubmissions > 0 ? (successfulEvents / totalSubmissions) * 100 : 0
    };
  }
);
