<!-- Редактор компонентов страницы -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ComponentList from './ComponentList.svelte';
  import ComponentEditor from './ComponentEditor.svelte';
  import LayoutPreview from './LayoutPreview.svelte';
  import Notification from './Notification.svelte';
  import { 
    componentEditMode,
    componentNotification,
    componentActions,
    isCreatingComponent,
    isEditingComponent,
    currentComponent
  } from '$lib/stores/componentStore';
  import { 
    layouts,
    layoutLoading,
    layoutError,
    currentPageLayout,
    hasPageLayout,
    layoutActions
  } from '$lib/stores/layoutStore';
  import { 
    currentPage,
    pageActions
  } from '$lib/stores/pageStore';
  import type { ComponentInstance, Layout } from '$lib/types/page';

  // Получение ID страницы из URL
  $: pageId = $page.params.id;

  // Локальное состояние
  let showEditor = false;
  let editingComponent: ComponentInstance | null = null;
  let showLayoutSelector = false;
  let selectedLayoutId = '';

  // Загрузка данных при монтировании
  onMount(async () => {
    if (pageId) {
      await pageActions.loadPage(parseInt(pageId));
      await layoutActions.loadLayouts();
      await layoutActions.loadPageLayout(parseInt(pageId));
      await componentActions.loadComponentInstances(parseInt(pageId));
      await componentActions.loadAvailableComponents();
    }
  });

  // Обработка редактирования компонента
  function handleEdit(component: ComponentInstance) {
    editingComponent = component;
    showEditor = true;
  }

  // Обработка удаления компонента
  function handleDelete(component: ComponentInstance) {
    if (editingComponent?.id === component.id) {
      editingComponent = null;
      showEditor = false;
    }
  }

  // Обработка создания нового компонента
  function handleCreateNew() {
    componentActions.startCreate();
    showEditor = true;
  }

  // Обработка закрытия редактора
  function handleCloseEditor() {
    showEditor = false;
    editingComponent = null;
    componentActions.startView();
  }

  // Обработка скрытия уведомления
  function handleHideNotification() {
    componentActions.hideNotification();
  }

  // Обработка возврата к редактированию страницы
  function handleBackToPage() {
    goto(`/pages/${pageId}/edit`);
  }

  // Обработка выбора раскладки
  function openLayoutSelector() {
    showLayoutSelector = true;
  }

  function closeLayoutSelector() {
    showLayoutSelector = false;
    selectedLayoutId = '';
  }

  async function applyLayout() {
    if (selectedLayoutId && pageId) {
      try {
        await layoutActions.setPageLayout(parseInt(pageId), selectedLayoutId);
        closeLayoutSelector();
      } catch (err) {
        console.error('Ошибка применения раскладки:', err);
      }
    }
  }

  // Получение заголовка страницы
  $: pageTitle = $currentPage?.title || 'Страница';
</script>

<svelte:head>
  <title>Компоненты страницы: {pageTitle} - Админ панель</title>
</svelte:head>

<div class="page-components-editor">
  <div class="page-header">
    <div class="header-content">
      <div class="breadcrumbs">
        <a href="/" class="breadcrumb-link">Главная</a>
        <span class="breadcrumb-separator">›</span>
        <a href="/pages" class="breadcrumb-link">📄 Страницы</a>
        <span class="breadcrumb-separator">›</span>
        <a href="/pages/{pageId}/edit" class="breadcrumb-link">Редактирование: {pageTitle}</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Компоненты</span>
      </div>
      
      <h1 class="page-title">
        <span class="page-icon">🧩</span>
        Компоненты страницы: {pageTitle}
      </h1>
      
      <p class="page-description">
        Управляйте компонентами, размещенными на этой странице
      </p>
    </div>
  </div>

  <div class="page-content">
    {#if showEditor}
      <ComponentEditor 
        onCancel={handleCloseEditor}
      />
    {:else}
      <!-- Информация о раскладке -->
      <!-- <div class="layout-section">
        <div class="layout-header">
          <h3>Раскладка страницы</h3>
          <button class="btn btn-secondary" on:click={openLayoutSelector}>
            {#if $hasPageLayout}
              Изменить раскладку
            {:else}
              Выбрать раскладку
            {/if}
          </button>
        </div>
        
        {#if $hasPageLayout && $currentPageLayout && $currentPageLayout.layout}
          <div class="current-layout">
            <h4>Текущая раскладка: {$currentPageLayout.layout.name}</h4>
            <LayoutPreview layout={$currentPageLayout.layout} />
          </div>
        {:else}
          <div class="no-layout">
            <p>Раскладка не выбрана</p>
            <span>Выберите раскладку для размещения компонентов на странице</span>
          </div>
        {/if}
      </div> -->

      <!-- Список компонентов -->
      <div class="components-section">
        <div class="section-header">
          <h3>Компоненты страницы</h3>
          <!-- <button 
            class="btn btn-primary"
            on:click={handleCreateNew}
            disabled={!$hasPageLayout}
          >
            Добавить компонент
          </button> -->
        </div>
        
        {#if !$hasPageLayout}
          <div class="no-layout-warning">
            <p>⚠️ Сначала выберите раскладку для страницы, чтобы добавить компоненты</p>
          </div>
        {:else}
          <ComponentList 
            onEdit={handleEdit}
            onDelete={handleDelete}
            allowDragDrop={true}
            autoLoad={false}
          />
        {/if}
      </div>

      <!-- Кнопка возврата -->
      <div class="actions-section">
        <button class="btn btn-secondary" on:click={handleBackToPage}>
          ← Вернуться к редактированию страницы
        </button>
      </div>
    {/if}
  </div>

  <!-- Модальное окно выбора раскладки -->
  {#if showLayoutSelector}
    <div class="modal-overlay" on:click={closeLayoutSelector} on:keydown={(e) => e.key === 'Escape' && closeLayoutSelector()} role="dialog" aria-modal="true" tabindex="0">
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div class="modal-content" on:click|stopPropagation role="document">
        <div class="modal-header">
          <h2>Выбор раскладки</h2>
          <button class="modal-close" on:click={closeLayoutSelector}>✕</button>
        </div>
        
        <div class="modal-body">
          {#if $layoutLoading}
            <div class="loading-state">
              <div class="loading-spinner"></div>
              <p>Загрузка раскладок...</p>
            </div>
          {:else if $layoutError}
            <div class="error-state">
              <p>❌ {$layoutError}</p>
              <button class="btn btn-primary" on:click={() => layoutActions.reloadLayouts()}>
                Попробовать снова
              </button>
            </div>
          {:else if $layouts.length === 0}
            <div class="empty-state">
              <p>📐 Раскладки не найдены</p>
              <span>Создайте первую раскладку для использования</span>
            </div>
          {:else}
            <div class="layouts-grid">
              {#each $layouts as layout (layout.id)}
                <div 
                  class="layout-card"
                  class:selected={selectedLayoutId === layout.id}
                  on:click={() => selectedLayoutId = layout.id}
                  on:keydown={(e) => e.key === 'Enter' && (selectedLayoutId = layout.id)}
                  role="button"
                  tabindex="0"
                >
                  <div class="layout-preview-small">
                    <LayoutPreview layout={layout || null} />
                  </div>
                  <div class="layout-info">
                    <h4>{layout.name}</h4>
                    {#if layout.description}
                      <p>{layout.description}</p>
                    {/if}
                    <span class="layout-zones">{layout.zones.length} зон</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" on:click={closeLayoutSelector}>
            Отмена
          </button>
          <button 
            class="btn btn-primary" 
            on:click={applyLayout}
            disabled={!selectedLayoutId || $layoutLoading}
          >
            Применить раскладку
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Уведомления -->
  {#if $componentNotification}
    <Notification 
      type={$componentNotification.type}
      message={$componentNotification.message}
      show={$componentNotification.show}
      on:hide={handleHideNotification}
    />
  {/if}
</div>

<style>
  .page-components-editor {
    min-height: 100vh;
    background-color: var(--color-bg);
  }

  .page-header {
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-6);
  }

  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
    font-size: 0.875rem;
    color: var(--color-muted);
  }

  .breadcrumb-link {
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.15s ease-in-out;
  }

  .breadcrumb-link:hover {
    color: var(--color-primary-hover);
    text-decoration: underline;
  }

  .breadcrumb-separator {
    color: var(--color-muted);
  }

  .breadcrumb-current {
    color: var(--color-text);
    font-weight: 500;
  }

  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-2) 0;
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .page-icon {
    font-size: 1.5rem;
  }

  .page-description {
    color: var(--color-muted);
    font-size: 0.95rem;
    margin: 0;
    line-height: 1.5;
  }

  .page-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-6);
  }

  .layout-section {
    background: var(--color-surface);
    border-radius: var(--radius-2);
    border: 1px solid var(--color-border);
    padding: var(--space-4);
    margin-bottom: var(--space-6);
    box-shadow: var(--shadow-sm);
  }

  .layout-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-3);
  }

  .layout-header h3 {
    margin: 0;
    color: var(--color-text);
    font-size: 1.1rem;
  }

  .current-layout h4 {
    margin: 0 0 var(--space-3) 0;
    color: var(--color-text);
    font-size: 1rem;
  }

  .no-layout {
    text-align: center;
    padding: var(--space-5);
    color: var(--color-muted);
  }

  .no-layout p {
    font-size: 1rem;
    margin: 0 0 var(--space-2) 0;
    color: var(--color-text);
  }

  .no-layout span {
    font-size: 0.875rem;
  }

  .components-section {
    background: var(--color-surface);
    border-radius: var(--radius-2);
    border: 1px solid var(--color-border);
    padding: var(--space-4);
    margin-bottom: var(--space-6);
    box-shadow: var(--shadow-sm);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .section-header h3 {
    margin: 0;
    color: var(--color-text);
    font-size: 1.1rem;
  }

  .no-layout-warning {
    text-align: center;
    padding: var(--space-5);
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: var(--radius-2);
    color: #92400e;
  }

  .actions-section {
    text-align: center;
  }
  /* Локальные стили кнопок удалены — используются глобальные .btn */

  /* Модальное окно */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--color-surface);
    border-radius: var(--radius-2);
    border: 1px solid var(--color-border);
    max-width: 800px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-md);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    margin: 0;
    color: var(--color-text);
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: var(--color-muted);
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-body {
    padding: var(--space-4);
    overflow-y: auto;
    flex: 1;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: var(--space-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-5);
    color: var(--color-muted);
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--color-border);
    border-top: 3px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--space-3);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-state {
    text-align: center;
    padding: var(--space-5);
    color: var(--color-muted);
  }

  .empty-state {
    text-align: center;
    padding: var(--space-5);
    color: var(--color-muted);
  }

  .layouts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--space-3);
  }

  .layout-card {
    border: 2px solid var(--color-border);
    border-radius: var(--radius-2);
    padding: var(--space-3);
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--color-surface);
  }

  .layout-card:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
  }

  .layout-card.selected {
    border-color: var(--color-primary);
    background: #eff6ff;
  }

  .layout-preview-small {
    height: 100px;
    margin-bottom: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-1);
    overflow: hidden;
  }

  .layout-info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text);
    font-size: 1rem;
  }

  .layout-info p {
    margin: 0 0 0.5rem 0;
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  .layout-zones {
    color: var(--color-muted);
    font-size: 0.75rem;
  }

  @media (max-width: 768px) {
    .page-content {
      padding: var(--space-4);
    }

    .header-content {
      padding: var(--space-4);
    }

    .page-title {
      font-size: 1.5rem;
    }

    .layout-header,
    .section-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .modal-content {
      width: 95%;
    }

    .layouts-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
