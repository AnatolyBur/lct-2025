<!-- Редактор компонентов -->
<script lang="ts">
  import { onMount } from 'svelte';
  import DynamicForm from './DynamicForm.svelte';
  import ComponentPreview from './ComponentPreview.svelte';
  import { 
    availableComponents,
    currentComponent, 
    currentComponentMetadata,
    componentEditMode, 
    componentLoading, 
    componentError, 
    componentActions,
    isCreatingComponent,
    isEditingComponent,
    selectedComponentType
  } from '$lib/stores/componentStore';
  import type { ComponentInstance, Component } from '$lib/types/page';
  import { apiClient } from '$lib/api/client';

  export let onCancel: () => void = () => {};

  // Локальное состояние для формы
  let formData: Record<string, any> = {};
  let selectedComponent: Component | null = null;
  let showComponentSelector = false;
  let availablePageTypes: Array<{ model_name: string; app_label?: string; verbose_name: string; fields: any[] }> = [];

  // Загрузка компонентов при монтировании
  onMount(async () => {
    try {
      availablePageTypes = await apiClient.getAllComponentsMetadata();
    } catch (e) {
      console.error('Не удалось загрузить метаданные компонентов:', e);
    }
  });

  // Инициализация формы при изменении режима или компонента
  $: if ($isCreatingComponent && $selectedComponentType) {
    selectedComponent = $selectedComponentType;
    initializeForm();
  }

  // Реактивное обновление данных при редактировании
  $: if ($isEditingComponent && $currentComponent && $currentComponentMetadata) {
    
    // Обновляем данные формы из data.object
    const componentData = $currentComponent.data?.object || $currentComponent.data || {};
    formData = { ...componentData };
    
    
    // Обновляем информацию о компоненте
    selectedComponent = {
      id: $currentComponent.component_id,
      name: $currentComponentMetadata.component_name,
      type: $currentComponentMetadata.component_type,
      config: $currentComponentMetadata.config,
      fields: $currentComponentMetadata.fields
    };
  }

  function initializeForm() {
    if (selectedComponent) {
      formData = {};
      // Инициализируем значения по умолчанию
      selectedComponent.fields.forEach(field => {
        if (field.default_value !== undefined) {
          formData[field.name] = field.default_value;
        }
      });
    }
  }

  // Обработка сохранения компонента
  async function handleSave(data?: Record<string, any>) {
    // Используем переданные данные или текущие данные формы
    const saveData = data || formData;
    
    try {
      if ($isCreatingComponent && selectedComponent) {
        // Попробуем получить pageId из URL, если находимся в редакторе компонентов страницы
        let pageId: number | undefined = undefined;
        try {
          const m = window.location.pathname.match(/\/pages\/(\d+)\//);
          if (m && m[1]) pageId = parseInt(m[1]);
        } catch {}

        await componentActions.createComponent(
          selectedComponent.component_type!, 
          saveData,
          { pageId }
        );
      } else if ($isEditingComponent && $currentComponent) {
        await componentActions.updateComponentInstance($currentComponent.id.toString(), saveData);
      }
      
      onCancel();
    } catch (err) {
      console.error('Ошибка сохранения компонента:', err);
    }
  }

  // Обработка выбора типа компонента
  function handleComponentTypeSelect(component: Component) {
    selectedComponent = component;
    showComponentSelector = false;
    initializeForm();
  }

  // Обработка отмены
  function handleCancel() {
    componentActions.startView();
    onCancel();
  }


  // Получение заголовка в зависимости от режима
  $: title = $isCreatingComponent 
    ? (selectedComponent ? `Создание компонента "${selectedComponent.name}"` : 'Выбор типа компонента')
    : `Редактирование компонента "${$currentComponent?.component.name || ''}"`;
</script>

<div class="component-editor">
  <div class="editor-header">
    <h2>{title}</h2>
    <div class="header-actions">
      <button 
        class="btn btn-secondary" 
        on:click={handleCancel}
        disabled={$componentLoading}
      >
        Отмена
      </button>
      {#if $isCreatingComponent && selectedComponent}
        <button 
          type="submit"
          form="component-form"
          class="btn btn-primary" 
          disabled={$componentLoading}
        >
          Создать
        </button>
      {:else if $isEditingComponent}
        <button 
          type="submit"
          form="component-form"
          class="btn btn-primary" 
          disabled={$componentLoading}
        >
          Сохранить
        </button>
      {/if}
    </div>
  </div>

  {#if $componentError}
    <div class="error-message">
      <p>{$componentError}</p>
      <button class="btn btn-sm btn-secondary" on:click={() => componentActions.clearError()}>
        Закрыть
      </button>
    </div>
  {/if}

  {#if $componentLoading}
    <div class="loading">
      <p>Загрузка...</p>
    </div>
  {:else}
    <div class="editor-content">
      {#if $isCreatingComponent && !selectedComponent}
        <!-- Выбор типа компонента -->
        <div class="component-selector">
          <h3>Выберите тип компонента:</h3>
          <div class="component-grid">
            {#each availablePageTypes as pageType}
              <div 
                class="component-card"
                on:click={() => handleComponentTypeSelect({
                  // подставляем структуру, похожую на Component, чтобы остальная логика работала
                  id: pageType.model_name,
                  name: pageType.verbose_name,
                  type: pageType.model_name,
                  component_type: pageType.model_name,
                  config: { description: pageType.verbose_name },
                  fields: pageType.fields
                } as unknown as Component)}
                role="button"
                tabindex="0"
                on:keydown={(e) => e.key === 'Enter' && handleComponentTypeSelect({
                  id: pageType.model_name,
                  name: pageType.verbose_name,
                  type: pageType.model_name,
                  component_type: pageType.model_name,
                  config: { description: pageType.verbose_name },
                  fields: pageType.fields
                } as unknown as Component)}
              >
                <div class="component-icon">
                  {#if false}
                    📝
                  {:else if false}
                    🖼️
                  {:else if false}
                    📋
                  {:else if false}
                    📐
                  {:else}
                    ⚙️
                  {/if}
                </div>
                <h4>{pageType.verbose_name}</h4>
                <p class="component-description">
                  {pageType.verbose_name}
                </p>
                {#if false}
                  <div class="component-info">
                    <small></small>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {:else if selectedComponent && ($currentComponentMetadata || $isCreatingComponent)}
        <!-- Форма редактирования компонента -->
        <div class="editor-form">
          <!-- Информация о компоненте -->
          <div class="component-info-section">
            <h3>Информация о компоненте</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Дата создания:</span>
                <span class="readonly-value">
                  {#if $currentComponent?.created_at}
                    {new Date($currentComponent.created_at).toLocaleString('ru-RU')}
                  {:else}
                    —
                  {/if}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Дата изменения:</span>
                <span class="readonly-value">
                  {#if $currentComponent?.updated_at}
                    {new Date($currentComponent.updated_at).toLocaleString('ru-RU')}
                  {:else}
                    —
                  {/if}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">ID компонента:</span>
                <span class="readonly-value">{$currentComponent?.component_id || '—'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Тип компонента:</span>
                <span class="readonly-value">{$currentComponentMetadata?.component_type || selectedComponent?.type || '—'}</span>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Настройки компонента</h3>
            <DynamicForm 
              id="component-form"
              fields={$currentComponentMetadata?.fields || selectedComponent?.fields || []}
              initialData={formData as any}
              onSubmit={handleSave}
              onDataChange={(data) => {
                // Проверяем, действительно ли данные изменились
                // if (JSON.stringify(formData) !== JSON.stringify(data)) {
                formData = data as Record<string, any>;
                // }
              }}
            />
          </div>


          <!-- Предварительный просмотр -->
          <div class="form-section">
            <h3>Предварительный просмотр</h3>
            <ComponentPreview 
              component={selectedComponent}
              data={formData}
            />
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .component-editor {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e0e0e0;
  }

  .editor-header h2 {
    margin: 0;
    color: #333;
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }

  .error-message {
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
    color: #c33;
  }

  .error-message p {
    margin: 0 0 10px 0;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .component-selector {
    margin-bottom: 30px;
  }

  .component-selector h3 {
    margin-bottom: 20px;
    color: #333;
  }

  .component-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }

  .component-card {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
  }

  .component-card:hover {
    border-color: #007bff;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
    transform: translateY(-2px);
  }

  .component-card:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }

  .component-icon {
    font-size: 2em;
    text-align: center;
    margin-bottom: 10px;
  }

  .component-card h4 {
    margin: 0 0 10px 0;
    color: #333;
    text-align: center;
  }

  .component-description {
    color: #666;
    font-size: 0.9em;
    text-align: center;
    margin: 0 0 10px 0;
  }

  .component-info {
    text-align: center;
    color: #999;
  }

  .editor-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }

  .component-info-section {
    grid-column: 1 / -1;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .component-info-section h3 {
    margin: 0 0 20px 0;
    color: #333;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 10px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .info-item .info-label {
    font-weight: 600;
    color: #555;
    font-size: 0.9em;
  }

  .readonly-value {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 8px 12px;
    color: #495057;
    font-family: monospace;
    font-size: 0.9em;
  }

  .form-section {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
  }

  .form-section h3 {
    margin: 0 0 20px 0;
    color: #333;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 10px;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0056b3;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #545b62;
  }

  .btn-sm {
    padding: 4px 8px;
    font-size: 12px;
  }

  @media (max-width: 768px) {
    .editor-form {
      grid-template-columns: 1fr;
    }
    
    .component-grid {
      grid-template-columns: 1fr;
    }
    
    .info-grid {
      grid-template-columns: 1fr;
    }
    
    .editor-header {
      flex-direction: column;
      gap: 15px;
      align-items: stretch;
    }
    
    .header-actions {
      justify-content: center;
    }
  }
</style>
