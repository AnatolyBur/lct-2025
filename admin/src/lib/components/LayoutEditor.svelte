<!-- Редактор раскладок -->
<script lang="ts">
  import { onMount } from 'svelte';
  import LayoutPreview from './LayoutPreview.svelte';
  import { 
    layouts,
    currentLayout, 
    layoutEditMode, 
    layoutLoading, 
    layoutError, 
    layoutActions,
    isCreatingLayout,
    isEditingLayout 
  } from '$lib/stores/layoutStore';
  import { 
    availableComponents,
    componentActions
  } from '$lib/stores/componentStore';
  import type { Layout, LayoutZone, Component } from '$lib/types/page';

  export let onCancel: () => void = () => {};

  // Локальное состояние формы
  let formData: Layout = {
    id: '',
    name: '',
    description: '',
    zones: []
  };

  // Загрузка раскладок и компонентов при монтировании
  onMount(() => {
    layoutActions.loadLayouts();
    componentActions.loadAvailableComponents();
  });

  // Инициализация формы при изменении текущей раскладки
  $: if ($currentLayout && $isEditingLayout) {
    formData = { ...$currentLayout };
  } else if ($isCreatingLayout) {
    formData = {
      id: '',
      name: '',
      description: '',
      zones: []
    };
  }

  // Обработка сохранения раскладки
  async function handleSave() {
    try {
      if ($isCreatingLayout) {
        await layoutActions.createLayout(formData);
      } else if ($isEditingLayout && $currentLayout?.id) {
        await layoutActions.updateLayout($currentLayout.id, formData);
      }
    } catch (err) {
      console.error('Ошибка сохранения раскладки:', err);
    }
  }

  // Обработка отмены
  function handleCancel() {
    layoutActions.startViewLayout();
    onCancel();
  }

  // Добавление новой зоны
  function addZone() {
    const newZone: LayoutZone = {
      id: `zone-${Date.now()}`,
      name: `Зона ${formData.zones.length + 1}`,
      type: 'column',
      width: 100,
      components: []
    };
    formData.zones = [...formData.zones, newZone];
  }

  // Удаление зоны
  function removeZone(zoneId: string) {
    formData.zones = formData.zones.filter(zone => zone.id !== zoneId);
  }

  // Обновление зоны
  function updateZone(zoneId: string, updatedZone: Partial<LayoutZone>) {
    formData.zones = formData.zones.map(zone => 
      zone.id === zoneId ? { ...zone, ...updatedZone } : zone
    );
  }

  // Добавление компонента в зону
  function addComponentToZone(zoneId: string, component: Component) {
    const newComponent = {
      id: `comp-${Date.now()}`,
      component_id: component.id,
      component: component,
      config: {},
      position: {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      }
    };

    formData.zones = formData.zones.map(zone => 
      zone.id === zoneId 
        ? { ...zone, components: [...zone.components, newComponent] }
        : zone
    );
  }

  // Удаление компонента из зоны
  function removeComponentFromZone(zoneId: string, componentId: string) {
    formData.zones = formData.zones.map(zone => 
      zone.id === zoneId 
        ? { ...zone, components: zone.components.filter(comp => comp.id !== componentId) }
        : zone
    );
  }

  // Обновление компонента в зоне
  function updateComponentInZone(zoneId: string, componentId: string, updatedComponent: any) {
    formData.zones = formData.zones.map(zone => 
      zone.id === zoneId 
        ? { 
            ...zone, 
            components: zone.components.map(comp => 
              comp.id === componentId ? { ...comp, ...updatedComponent } : comp
            )
          }
        : zone
    );
  }

  // Получение заголовка формы
  $: formTitle = $isCreatingLayout ? 'Создание раскладки' : 'Редактирование раскладки';
</script>

<div class="layout-editor">
  <div class="editor-header">
    <h1>{formTitle}</h1>
    <p>Создайте или отредактируйте раскладку для размещения компонентов</p>
  </div>

  {#if $layoutError}
    <div class="error-banner">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{$layoutError}</span>
        <button class="error-close" on:click={() => layoutActions.clearLayoutError()}>
          ✕
        </button>
      </div>
    </div>
  {/if}

  <div class="editor-content">
    <div class="form-section">
      <h2>Основная информация</h2>
      
      <div class="form-group">
        <label for="layout-name">Название раскладки</label>
        <input
          id="layout-name"
          type="text"
          bind:value={formData.name}
          placeholder="Введите название раскладки"
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="layout-description">Описание</label>
        <textarea
          id="layout-description"
          bind:value={formData.description}
          placeholder="Описание раскладки (необязательно)"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <h2>Зоны раскладки</h2>
        <button class="btn btn-secondary" on:click={addZone}>
          + Добавить зону
        </button>
      </div>

      {#if formData.zones.length === 0}
        <div class="empty-state">
          <p>Зоны не добавлены. Нажмите "Добавить зону" для создания первой зоны.</p>
        </div>
      {:else}
        <div class="zones-list">
          {#each formData.zones as zone (zone.id)}
            <div class="zone-item">
              <div class="zone-header">
                <h3>{zone.name}</h3>
                <button 
                  class="btn btn-danger btn-sm" 
                  on:click={() => removeZone(zone.id)}
                >
                  Удалить
                </button>
              </div>
              
              <div class="zone-form">
                <div class="form-row">
                  <div class="form-group">
                    <label>Название зоны</label>
                    <input
                      type="text"
                      bind:value={zone.name}
                      on:input={(e) => updateZone(zone.id, { name: (e.target as HTMLInputElement).value })}
                      class="form-input"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label>Тип зоны</label>
                    <select
                      bind:value={zone.type}
                      on:change={(e) => updateZone(zone.id, { type: (e.target as HTMLSelectElement).value })}
                      class="form-select"
                    >
                      <option value="column">Колонка</option>
                      <option value="row">Строка</option>
                      <option value="grid">Сетка</option>
                      <option value="flex">Flex</option>
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  {#if zone.type === 'column'}
                    <div class="form-group">
                      <label>Ширина (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        bind:value={zone.width}
                        on:input={(e) => updateZone(zone.id, { width: parseInt((e.target as HTMLInputElement).value) })}
                        class="form-input"
                      />
                    </div>
                  {:else if zone.type === 'row'}
                    <div class="form-group">
                      <label>Высота (px)</label>
                      <input
                        type="number"
                        min="1"
                        bind:value={zone.height}
                        on:input={(e) => updateZone(zone.id, { height: parseInt((e.target as HTMLInputElement).value) })}
                        class="form-input"
                      />
                    </div>
                  {:else if zone.type === 'flex'}
                    <div class="form-group">
                      <label>Flex</label>
                      <input
                        type="number"
                        min="0"
                        bind:value={zone.flex}
                        on:input={(e) => updateZone(zone.id, { flex: parseInt((e.target as HTMLInputElement).value) })}
                        class="form-input"
                      />
                    </div>
                  {:else if zone.type === 'grid'}
                    <div class="form-group">
                      <label>Grid Template</label>
                      <input
                        type="text"
                        bind:value={zone.grid_template}
                        on:input={(e) => updateZone(zone.id, { grid_template: (e.target as HTMLInputElement).value })}
                        placeholder="repeat(3, 1fr) / repeat(3, 1fr)"
                        class="form-input"
                      />
                    </div>
                  {/if}
                </div>

                <!-- Секция компонентов -->
                <div class="components-section">
                  <div class="components-header">
                    <h4>Компоненты в зоне ({zone.components.length})</h4>
                    <div class="component-actions">
                      <select 
                        class="component-selector"
                        on:change={(e) => {
                          const componentId = (e.target as HTMLSelectElement).value;
                          if (componentId) {
                            const component = $availableComponents.find(c => c.id === componentId);
                            if (component) {
                              addComponentToZone(zone.id, component);
                              (e.target as HTMLSelectElement).value = '';
                            }
                          }
                        }}
                      >
                        <option value="">Добавить компонент</option>
                        {#each $availableComponents as component}
                          <option value={component.id}>{component.name}</option>
                        {/each}
                      </select>
                    </div>
                  </div>

                  {#if zone.components.length === 0}
                    <div class="empty-components">
                      <p>В этой зоне нет компонентов</p>
                    </div>
                  {:else}
                    <div class="components-list">
                      {#each zone.components as component (component.id)}
                        <div class="component-item">
                          <div class="component-info">
                            <span class="component-icon">
                              {#if component.component.type === 'content'}
                                📝
                              {:else if component.component.type === 'media'}
                                🖼️
                              {:else if component.component.type === 'form'}
                                📋
                              {:else if component.component.type === 'layout'}
                                📐
                              {:else}
                                ⚙️
                              {/if}
                            </span>
                            <div class="component-details">
                              <strong>
                                {component.component.name || component.component.title || component.config?.title || `Компонент ${component.component.type || component.component.component_type || 'неизвестный'}`}
                              </strong>
                              <small>{component.component.type}</small>
                            </div>
                          </div>
                          <div class="component-controls">
                            <button 
                              class="btn btn-sm btn-secondary"
                              on:click={() => removeComponentFromZone(zone.id, component.id)}
                              title="Удалить компонент"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="form-section">
      <h2>Предварительный просмотр</h2>
      <LayoutPreview layout={formData || null} />
    </div>

    <div class="form-actions">
      <button 
        class="btn btn-secondary" 
        on:click={handleCancel}
        disabled={$layoutLoading}
      >
        Отмена
      </button>
      <button 
        class="btn btn-primary" 
        on:click={handleSave}
        disabled={$layoutLoading || !formData.name.trim()}
      >
        {#if $layoutLoading}
          <span class="loading-spinner"></span>
          Сохранение...
        {:else}
          Сохранить раскладку
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .layout-editor {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .editor-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .editor-header h1 {
    font-size: 2.25rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .editor-header p {
    color: #6b7280;
    font-size: 1.125rem;
  }

  .error-banner {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }

  .error-content {
    display: flex;
    align-items: center;
    padding: 1rem;
    gap: 0.75rem;
  }

  .error-icon {
    font-size: 1.25rem;
  }

  .error-text {
    flex: 1;
    color: #dc2626;
    font-weight: 500;
  }

  .error-close {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.15s ease-in-out;
  }

  .error-close:hover {
    background-color: rgba(220, 38, 38, 0.1);
  }

  .editor-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .form-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
  }

  .form-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 1rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-header h2 {
    margin-bottom: 0;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .form-input,
  .form-textarea,
  .form-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: border-color 0.15s ease-in-out;
  }

  .form-input:focus,
  .form-textarea:focus,
  .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
  }

  .zones-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .zone-item {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    background: #f9fafb;
  }

  .zone-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .zone-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .zone-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    border: none;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .btn-secondary {
    background-color: #6b7280;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: #4b5563;
  }

  .btn-danger {
    background-color: #dc2626;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background-color: #b91c1c;
  }

  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Стили для секции компонентов */
  .components-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .components-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .components-header h4 {
    margin: 0;
    font-size: 0.875rem;
    color: #374151;
  }

  .component-selector {
    padding: 0.375rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
  }

  .component-selector:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .empty-components {
    text-align: center;
    padding: 1rem;
    color: #6b7280;
    font-size: 0.875rem;
    background: #f9fafb;
    border-radius: 0.375rem;
    border: 1px dashed #d1d5db;
  }

  .components-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .component-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    transition: all 0.15s ease;
  }

  .component-item:hover {
    border-color: #d1d5db;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .component-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .component-icon {
    font-size: 1.25rem;
  }

  .component-details {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .component-details strong {
    font-size: 0.875rem;
    color: #374151;
  }

  .component-details small {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .component-controls {
    display: flex;
    gap: 0.25rem;
  }
</style>
