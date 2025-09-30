<!-- Список компонентов -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    componentInstances,
    componentLoading, 
    componentError, 
    componentActions,
    availableComponents
  } from '$lib/stores/componentStore';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import ComponentModal from './ComponentModal.svelte';
  import DragDropContainer from './DragDropContainer.svelte';
  import type { ComponentInstance, Component } from '$lib/types/page';

  export let onEdit: (component: ComponentInstance) => void = () => {};
  export let onDelete: (component: ComponentInstance) => void = () => {};
  export let allowDragDrop = true;
  export let autoLoad: boolean = true;

  // Локальное состояние
  let searchQuery = '';
  let selectedType = '';
  let showModal = false;
  let modalComponent: ComponentInstance | null = null;
  let modalMode: 'create' | 'edit' = 'edit';

  // Загрузка данных при монтировании
  onMount(() => {
    if (autoLoad) {
      componentActions.loadComponentInstances();
      componentActions.loadAvailableComponents();
    }
  });

  // Фильтрация компонентов
  $: filteredComponents = $componentInstances.filter(instance => {
    // Фильтр по поиску
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        instance.component.name.toLowerCase().includes(query) ||
        instance.component.type.toLowerCase().includes(query) ||
        Object.values(instance.data).some(value => 
          String(value).toLowerCase().includes(query)
        );
      if (!matchesSearch) return false;
    }

    // Фильтр по типу
    if (selectedType && instance.component.type !== selectedType) {
      return false;
    }


    return true;
  });

  // Добавляем сортировку по view_order, если поле присутствует
  $: sortedComponents = [...filteredComponents].sort((a, b) => {
    const av = typeof a.view_order === 'number' ? a.view_order : Number.MAX_SAFE_INTEGER;
    const bv = typeof b.view_order === 'number' ? b.view_order : Number.MAX_SAFE_INTEGER;
    return av - bv;
  });

  // Получение уникальных типов компонентов
  $: componentTypes = [...new Set($availableComponents.map(c => c.type))];


  // Обработка удаления компонента
  async function handleDelete(component: ComponentInstance) {
    // Получаем название компонента для подтверждения
    const componentName = component.component.name || 
                         component.component.title || 
                         component.data?.object?.title || 
                         component.data?.title || 
                         `компонент типа "${component.component.type || component.component.component_type || 'неизвестный'}"`;
    
    if (confirm(`Вы уверены, что хотите удалить компонент "${componentName}"?`)) {
      try {
        await componentActions.deleteComponentInstance(String(component.id));
        onDelete(component);
      } catch (err) {
        console.error('Ошибка удаления компонента:', err);
      }
    }
  }

  // Обработка редактирования компонента
  function handleEdit(component: ComponentInstance) {
    modalComponent = component;
    modalMode = 'edit';
    showModal = true;
    componentActions.loadComponentInstance(String(component.id));
    onEdit(component);
  }

  // Обработка создания компонента
  function handleCreate() {
    modalComponent = null;
    modalMode = 'create';
    showModal = true;
    componentActions.startCreate();
  }

  // Обработка закрытия модального окна
  function handleModalClose() {
    showModal = false;
    modalComponent = null;
    componentActions.startView();
  }

  // Обработка сохранения в модальном окне
  function handleModalSave() {
    showModal = false;
    modalComponent = null;
    componentActions.startView();
  }

  // Обработка отмены в модальном окне
  function handleModalCancel() {
    showModal = false;
    modalComponent = null;
    componentActions.startView();
  }

  // Обработка переупорядочивания компонентов
  async function handleReorder(event: CustomEvent) {
    const { components: newComponents } = event.detail;
    
    console.log('🔄 ComponentList: Получено событие reorder', {
      oldComponents: $componentInstances.length,
      newComponents: newComponents.length,
      newOrder: newComponents.map((c: ComponentInstance) => ({ id: c.id, title: c.component.name }))
    });
    
    // Получаем ID страницы из URL
    const pageId = $page.params.id;
    
    if (pageId) {
      try {
        // Только триггерим обновление в store; локальный порядок применится из ответа сервера
        await componentActions.reorderPageComponents(parseInt(pageId), newComponents);
        console.log('✅ ComponentList: Порядок компонентов обновлён (по ответу сервера)');
      } catch (err) {
        console.error('❌ ComponentList: Ошибка обновления порядка компонентов:', err);
      }
    } else {
      // Нет pageId — обновляем локально
      componentInstances.set(newComponents);
      console.log('📝 ComponentList: Обновлено только локальное состояние (нет pageId)');
    }
  }


  // Получение иконки для типа компонента
  function getTypeIcon(type: string): string {
    switch (type) {
      case 'content': return '📝';
      case 'media': return '🖼️';
      case 'form': return '📋';
      case 'layout': return '📐';
      default: return '⚙️';
    }
  }

  // Форматирование даты
  function formatDate(dateString?: string): string {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  }

  // Получение ID формы из данных компонента
  function getFormId(component: ComponentInstance): number | null {
    return component.id;
  }

  // Проверка, является ли компонент формой
  function isFormComponent(component: ComponentInstance): boolean {
    return component.component.type === 'form' || 
           component.component.type === 'FormComponent' ||
           component.component.component_type === 'form' ||
           component.component.component_type === 'FormComponent';
  }

  // Навигация к редактированию формы
  function navigateToFormEdit(component: ComponentInstance) {
    const formId = getFormId(component);
    if (formId) {
      goto(`/forms/${formId}`);
    }
  }

  // Получение человеко-читаемого названия поля из предобработанных данных
  function getFieldDisplayName(component: ComponentInstance, fieldKey: string): string {
    // Используем предобработанные данные из store
    return component.fieldDisplayNames?.[fieldKey] || 
           fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/_/g, ' ');
  }
</script>

<div class="component-list">
  <div class="list-header">
    <h2>Компоненты</h2>
    <div class="header-actions">
      <button 
        class="btn btn-primary"
        on:click={handleCreate}
        disabled={$componentLoading}
      >
        Создать компонент
      </button>
    </div>
  </div>

  <!-- Фильтры -->
  <div class="filters">
    <div class="filter-group">
      <label for="search">Поиск:</label>
      <input 
        id="search"
        type="text" 
        bind:value={searchQuery}
        placeholder="Поиск по названию, типу или содержимому..."
        class="filter-input"
      />
    </div>
    
    <div class="filter-group">
      <label for="type">Тип:</label>
      <select id="type" bind:value={selectedType} class="filter-select">
        <option value="">Все типы</option>
        {#each componentTypes as type}
          <option value={type}>{type}</option>
        {/each}
      </select>
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
      <p>Загрузка компонентов...</p>
    </div>
  {:else if filteredComponents.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>Компоненты не найдены</h3>
      <p>
        {#if searchQuery || selectedType}
          Попробуйте изменить фильтры поиска
        {:else}
          Создайте первый компонент, чтобы начать работу
        {/if}
      </p>
    </div>
  {:else}
    {#if allowDragDrop}
      <DragDropContainer 
        components={sortedComponents}
        onEdit={handleEdit}
        onDelete={handleDelete}
        on:reorder={handleReorder}
      />
    {:else}
      <div class="components-grid">
        {#each sortedComponents as component}
          <div class="component-card">
            <div class="component-header">
              <div class="component-icon">
                {getTypeIcon(component.component.type)}
              </div>
              <div class="component-info">
                <h3 class="component-name">
                  {component.component.name || component.component.title || component.data?.object?.title || component.data?.title || `Компонент ${component.component.type || component.component.component_type || 'неизвестный'}`}
                </h3>
                <span class="component-type">{component.component.type}</span>
              </div>
              <div class="component-actions">
                {#if isFormComponent(component)}
                  <button 
                    class="btn btn-sm btn-primary"
                    on:click={() => navigateToFormEdit(component)}
                    title="Редактировать форму"
                    disabled={!getFormId(component)}
                  >
                    📋
                  </button>
                {/if}
                <button 
                  class="btn btn-sm btn-secondary"
                  on:click={() => handleEdit(component)}
                  title="Редактировать компонент"
                >
                  ✏️
                </button>
                <button 
                  class="btn btn-sm btn-danger"
                  on:click={() => handleDelete(component)}
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div class="component-content">
              <div class="component-data">
                {#each Object.entries(component.data) as [key, value]}
                  <div class="data-item">
                    <strong>{getFieldDisplayName(component, key)}:</strong> 
                    <span class="data-value">{String(value).substring(0, 50)}{String(value).length > 50 ? '...' : ''}</span>
                  </div>
                {/each}
              </div>
            </div>

            <div class="component-footer">
              <div class="component-meta">
                <small>Создан: {formatDate(component.created_at)}</small>
                {#if component.updated_at && component.updated_at !== component.created_at}
                  <small>Обновлен: {formatDate(component.updated_at)}</small>
                {/if}
              </div>
            </div>

          </div>
        {/each}
      </div>
    {/if}
  {/if}

  <!-- Модальное окно для редактирования -->
  <ComponentModal 
    bind:isOpen={showModal}
    mode={modalMode}
    on:close={handleModalClose}
    on:save={handleModalSave}
    on:cancel={handleModalCancel}
  />
</div>

<style>
  .component-list {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-4);
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }

  .list-header h2 {
    margin: 0;
    color: var(--color-text);
  }

  .filters {
    display: flex;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
    padding: var(--space-3);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    box-shadow: var(--shadow-sm);
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .filter-group label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-muted);
  }

  .filter-input,
  .filter-select {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-1);
    font-size: 14px;
  }

  .filter-input {
    min-width: 250px;
  }


  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius-1);
    padding: var(--space-3);
    margin-bottom: var(--space-4);
    color: #b91c1c;
  }

  .error-message p {
    margin: 0 0 10px 0;
  }

  .loading {
    text-align: center;
    padding: var(--space-6);
    color: var(--color-muted);
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--color-muted);
  }

  .empty-icon {
    font-size: 4em;
    margin-bottom: 20px;
  }

  .empty-state h3 {
    margin: 0 0 10px 0;
    color: var(--color-text);
  }

  .components-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--space-4);
  }

  .component-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    overflow: hidden;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);
  }

  .component-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .component-header {
    display: flex;
    align-items: center;
    padding: var(--space-3);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .component-icon {
    font-size: 1.5em;
    margin-right: 10px;
  }

  .component-info {
    flex: 1;
  }

  .component-name {
    margin: 0 0 5px 0;
    font-size: 16px;
    color: var(--color-text);
  }

  .component-type {
    background: var(--color-primary);
    color: #fff;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
  }

  .component-content {
    padding: var(--space-3);
  }

  .component-data {
    margin-bottom: 10px;
  }

  .data-item {
    margin-bottom: 8px;
    font-size: 13px;
  }

  .data-item strong {
    color: var(--color-text);
    margin-right: 5px;
  }

  .data-value {
    color: var(--color-muted);
  }

  .component-footer {
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .component-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .component-meta small {
    color: var(--color-muted);
    font-size: 11px;
  }

  /* Локальные определения .btn удалены — используются глобальные стили из лейаута */

  @media (max-width: 768px) {
    .components-grid {
      grid-template-columns: 1fr;
    }
    
    .filters {
      flex-direction: column;
    }
    
    .filter-input {
      min-width: auto;
    }
    
    .list-header {
      flex-direction: column;
      gap: 15px;
      align-items: stretch;
    }
  }
</style>
