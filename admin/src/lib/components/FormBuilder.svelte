<!-- Основной компонент конструктора форм -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import FormFieldTypes from './FormFieldTypes.svelte';
  import FormCanvas from './FormCanvas.svelte';
  import FormFieldEditor from './FormFieldEditor.svelte';
  import FormPreview from './FormPreview.svelte';
  import Notification from './Notification.svelte';
  import { 
    currentForm,
    forms,
    selectedField,
    previewMode,
    loading,
    error,
    notification,
    formBuilderActions,
    isCreatingForm,
    isEditingForm,
    hasCurrentForm,
    hasSelectedField,
    isDragging
  } from '$lib/stores/formBuilderStore';
  import type { FormBuilderConfig, FormBuilderField } from '$lib/types/formBuilder';

  // Получение ID формы из URL
  $: formId = $page.params.id ? parseInt($page.params.id) : null;
  
  // Реактивная загрузка формы при изменении ID
  $: if (formId && !isNaN(formId)) {
    formBuilderActions.loadForm(formId);
  }

  // Локальное состояние
  let showFieldTypes = true;
  let showFieldEditor = true;
  let showPreview = false;

  // Загрузка данных при монтировании
  onMount(async () => {
    if (formId && !isNaN(formId)) {
      console.log('Загружаем форму с ID:', formId);
      await formBuilderActions.loadForm(formId);
    } else {
      // Загружаем список форм только при создании новой формы
      await formBuilderActions.loadForms();
      // Создаем новую форму
      const newForm: Partial<FormBuilderConfig> = {
        title: 'Новая форма',
        form_title: 'Новая форма',
        form_description: '',
        submit_text: 'Отправить',
        success_message: 'Форма успешно отправлена!',
        email_notifications: false,
        notification_emails: '',
        save_submissions: true,
        is_active: true,
        form_config: {
          fields: [],
          layout: {
            type: 'single',
            columns: 1,
            gap: 16
          },
          styling: {
            theme: 'default',
            colors: {
              primary: '#3b82f6',
              secondary: '#6b7280',
              background: '#ffffff',
              text: '#374151'
            },
            fonts: {
              family: 'system-ui, sans-serif',
              size: '16px'
            }
          }
        }
      };
      
      const createdForm = await formBuilderActions.createForm(newForm);
      
      // Автоматически перенаправляем на страницу редактирования после создания
      if (createdForm && createdForm.id) {
        goto(`/forms/${createdForm.id}`);
      }
    }
  });

  // Обработка сохранения формы
  async function handleSave() {
    if (!$currentForm) return;
    
    try {
      await formBuilderActions.saveForm($currentForm);
      // Перенаправление больше не нужно здесь, так как оно происходит автоматически при создании
    } catch (err) {
      console.error('Ошибка сохранения формы:', err);
    }
  }

  // Обработка отмены
  function handleCancel() {
    if ($isCreatingForm) {
      goto('/forms');
    } else {
      // Сбрасываем изменения
      if (formId) {
        formBuilderActions.loadForm(formId);
      }
    }
  }

  // Обработка добавления поля
  function handleAddField(fieldType: string) {
    if (!$currentForm) return;
    
    const newField: FormBuilderField = {
      id: `field_${Date.now()}`,
      type: fieldType as any,
      name: `field_${Date.now()}`,
      label: `Новое поле`,
      placeholder: '',
      required: false,
      position: { x: 0, y: 0 },
      size: { width: 100, height: 40 },
      help_text: '',
      default_value: null
    };
    
    formBuilderActions.addField(newField);
    formBuilderActions.selectField(newField);
  }

  // Обработка выбора поля
  function handleSelectField(field: FormBuilderField | null) {
    formBuilderActions.selectField(field);
  }

  // Обработка обновления поля
  function handleUpdateField(fieldId: string, updates: Partial<FormBuilderField>) {
    formBuilderActions.updateField(fieldId, updates);
  }

  // Обработка удаления поля
  function handleDeleteField(fieldId: string) {
    formBuilderActions.removeField(fieldId);
  }

  // Обработка переупорядочивания полей
  function handleReorderFields(fieldIds: string[]) {
    formBuilderActions.reorderFields(fieldIds);
  }

  // Переключение режима предварительного просмотра
  function togglePreview() {
    showPreview = !showPreview;
    formBuilderActions.setPreviewMode(showPreview);
  }

  // Получение заголовка в зависимости от режима
  $: title = $isCreatingForm ? 'Создание формы' : 'Редактирование формы';
</script>

<div class="form-builder">
  <!-- Заголовок -->
  <div class="builder-header">
    <div class="header-left">
      <h1>{title}</h1>
      {#if $currentForm}
        <span class="form-title">{$currentForm.form_title}</span>
      {/if}
    </div>
    
    <div class="header-actions">
      <button 
        class="btn btn-secondary" 
        on:click={handleCancel}
        disabled={$loading}
      >
        Отмена
      </button>
      
      <button 
        class="btn btn-secondary" 
        on:click={togglePreview}
        disabled={$loading}
      >
        {showPreview ? 'Редактировать' : 'Предпросмотр'}
      </button>
      
      <button 
        class="btn btn-primary" 
        on:click={handleSave}
        disabled={$loading}
      >
        {#if $loading}
          Сохранение...
        {:else}
          Сохранить
        {/if}
      </button>
    </div>
  </div>

  <!-- Уведомления -->
  {#if $notification}
    <Notification 
      type={$notification.type}
      message={$notification.message}
      on:close={() => notification.set(null)}
    />
  {/if}

  <!-- Ошибки -->
  {#if $error}
    <div class="error-message">
      <p>{$error}</p>
      <button class="btn btn-sm btn-secondary" on:click={() => formBuilderActions.clearError()}>
        Закрыть
      </button>
    </div>
  {/if}

  <!-- Основной контент -->
  {#if $loading && !$currentForm}
    <div class="loading">
      <p>Загрузка...</p>
    </div>
  {:else if $currentForm}
    <div class="builder-content">
      {#if showPreview}
        <!-- Режим предварительного просмотра -->
        <div class="preview-container">
          <FormPreview form={$currentForm} />
        </div>
      {:else}
        <!-- Режим редактирования -->
        <div class="builder-panels">
          <!-- Панель типов полей -->
          {#if showFieldTypes}
            <div class="panel field-types-panel">
              <div class="panel-header">
                <h3>Типы полей</h3>
                <button 
                  class="panel-toggle" 
                  on:click={() => showFieldTypes = !showFieldTypes}
                >
                  {showFieldTypes ? '−' : '+'}
                </button>
              </div>
              <div class="panel-content">
                <FormFieldTypes on:addField={(e) => handleAddField(e.detail.fieldType)} />
              </div>
            </div>
          {/if}

          <!-- Рабочая область -->
          <div class="panel canvas-panel">
            <div class="panel-header">
              <h3>Конструктор формы</h3>
              <div class="canvas-actions">
                <button 
                  class="btn btn-sm btn-secondary" 
                  on:click={() => showFieldTypes = !showFieldTypes}
                >
                  {showFieldTypes ? 'Скрыть' : 'Показать'} типы полей
                </button>
                <button 
                  class="btn btn-sm btn-secondary" 
                  on:click={() => showFieldEditor = !showFieldEditor}
                >
                  {showFieldEditor ? 'Скрыть' : 'Показать'} редактор
                </button>
              </div>
            </div>
            <div class="panel-content">
              <FormCanvas 
                form={$currentForm}
                selectedField={$selectedField}
                on:selectField={(e) => handleSelectField(e.detail.field)}
                on:updateField={(e) => handleUpdateField(e.detail.fieldId, e.detail.updates)}
                on:deleteField={(e) => handleDeleteField(e.detail.fieldId)}
                on:reorderFields={(e) => handleReorderFields(e.detail.fieldIds)}
              />
            </div>
          </div>

          <!-- Панель редактирования поля -->
          {#if showFieldEditor && $selectedField}
            <div class="panel field-editor-panel">
              <div class="panel-header">
                <h3>Настройки поля</h3>
                <button 
                  class="panel-toggle" 
                  on:click={() => showFieldEditor = !showFieldEditor}
                >
                  {showFieldEditor ? '−' : '+'}
                </button>
              </div>
              <div class="panel-content">
                <FormFieldEditor 
                  field={$selectedField}
                  on:update={(e) => handleUpdateField($selectedField.id, e.detail.updates)}
                />
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .form-builder {
    min-height: 100vh;
    background: #f8fafc;
  }

  .builder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .header-left h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a202c;
  }

  .form-title {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .error-message {
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 0.375rem;
    padding: 1rem;
    margin: 1rem 2rem;
    color: #c33;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-message p {
    margin: 0;
  }

  .loading {
    text-align: center;
    padding: 4rem;
    color: #6b7280;
  }

  .builder-content {
    padding: 2rem;
  }

  .preview-container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .builder-panels {
    display: grid;
    grid-template-columns: 250px 1fr 300px;
    gap: 1rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .panel {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  .panel-toggle {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
  }

  .panel-toggle:hover {
    background: #e5e7eb;
  }

  .panel-content {
    padding: 1rem;
  }

  .canvas-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }

  /* Адаптивность */
  @media (max-width: 1200px) {
    .builder-panels {
      grid-template-columns: 200px 1fr 250px;
    }
  }

  @media (max-width: 768px) {
    .builder-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .header-actions {
      justify-content: center;
    }

    .builder-panels {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .builder-content {
      padding: 1rem;
    }
  }
</style>
