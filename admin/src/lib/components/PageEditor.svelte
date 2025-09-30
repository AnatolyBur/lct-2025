<!-- Основной редактор страниц -->
<script lang="ts">
  import { onMount } from 'svelte';
  import TranslatedDynamicForm from './TranslatedDynamicForm.svelte';
  import LayoutPreview from './LayoutPreview.svelte';
  import Notification from './Notification.svelte';
  import PagePreview from './PagePreview.svelte';
  import { 
    pageMetadata, 
    currentPage, 
    editMode, 
    loading, 
    error, 
    pageActions,
    isCreating,
    isEditing,
    notification,
    availablePageTypes
  } from '$lib/stores/pageStore';
  import { 
    layouts,
    currentPageLayout,
    layoutLoading,
    layoutError,
    layoutActions,
    hasPageLayout
  } from '$lib/stores/layoutStore';
  import type { PageData, Layout } from '$lib/types/page';

  export let onCancel: () => void = () => {};

  // Локальное состояние для выбора раскладки
  let selectedLayoutId: string = '';
  let showLayoutSelector = false;
  
  // Локальное состояние для выбора типа страницы
  let selectedPageType: string = '';
  let showPageTypeSelector = false;

  // Загрузка метаданных и раскладок при монтировании
  onMount(() => {
    pageActions.loadMetadata();
    layoutActions.loadLayouts();
  });

  // Загрузка раскладки страницы при изменении текущей страницы
  $: if ($currentPage?.id && $isEditing) {
    layoutActions.loadPageLayout($currentPage.id);
  }

  // Обработка сохранения страницы
  async function handleSave(pageData: PageData) {
    try {
      if ($isCreating) {
        // Добавляем выбранный тип страницы к данным
        const dataWithPageType = {
          ...pageData,
          page_type: $pageMetadata?.model_name || 'Page'
        };
        
        console.log('Создаем страницу с типом:', dataWithPageType.page_type);
        const newPage = await pageActions.createPage(dataWithPageType);
        console.log('Страница создана, ID:', newPage.id);
        
        // Редирект на редактирование созданной страницы
        if (newPage.id) {
          window.location.href = `/pages/${newPage.id}/edit`;
        }
      } else if ($isEditing && $currentPage?.id) {
        const updatedPage = await pageActions.updatePage($currentPage.id, pageData);
        console.log('Страница обновлена, ID:', updatedPage.id);
      }
    } catch (err) {
      console.error('Ошибка сохранения страницы:', err);
      // Ошибка уже обработана в store
    }
  }

  // Сохранение как черновик
  async function handleSaveAsDraft(pageData: PageData) {
    try {
      const draft = await pageActions.saveAsDraft(pageData);
      console.log('Черновик сохранен, ID:', draft?.id);
    } catch (err) {
      console.error('Ошибка сохранения черновика:', err);
    }
  }

  // Публикация
  async function handlePublish() {
    try {
      const published = await pageActions.publishCurrentPage();
      console.log('Страница опубликована, ID:', published?.id);
    } catch (err) {
      console.error('Ошибка публикации страницы:', err);
    }
  }

  // Обработка отмены
  function handleCancel() {
    pageActions.startView();
    onCancel();
  }

  // Применение раскладки к странице
  async function applyLayout() {
    if (!selectedLayoutId || !$currentPage?.id) return;
    
    try {
      await layoutActions.setPageLayout($currentPage.id, selectedLayoutId);
      showLayoutSelector = false;
      selectedLayoutId = '';
    } catch (err) {
      console.error('Ошибка применения раскладки:', err);
    }
  }

  // Открытие селектора раскладок
  function openLayoutSelector() {
    showLayoutSelector = true;
  }

  // Закрытие селектора раскладок
  function closeLayoutSelector() {
    showLayoutSelector = false;
    selectedLayoutId = '';
  }

  // Открытие селектора типов страниц
  function openPageTypeSelector() {
    showPageTypeSelector = true;
  }

  // Закрытие селектора типов страниц
  function closePageTypeSelector() {
    showPageTypeSelector = false;
    selectedPageType = '';
  }

  // Применение типа страницы
  async function applyPageType() {
    if (!selectedPageType) return;
    
    try {
      await pageActions.loadMetadataForPageType(selectedPageType);
      showPageTypeSelector = false;
      selectedPageType = '';
    } catch (err) {
      console.error('Ошибка применения типа страницы:', err);
    }
  }

  // Форматирование даты для отображения
  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Не указано';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Неверный формат даты';
    }
  }
</script>

<div class="page-editor">
  <div class="editor-header">
    <!-- Информация о датах создания и изменения -->
    {#if $currentPage && ($isEditing || $isCreating)}
      <div class="page-dates">
        <div class="date-info">
          <span class="date-label">📅 Дата создания:</span>
          <span class="date-value">{formatDate($currentPage.created_at)}</span>
        </div>
        {#if $currentPage.updated_at && $currentPage.updated_at !== $currentPage.created_at}
          <div class="date-info">
            <span class="date-label">🔄 Дата изменения:</span>
            <span class="date-value">{formatDate($currentPage.updated_at)}</span>
          </div>
        {/if}
      </div>
    {/if}

    {#if $isCreating && $availablePageTypes.length > 0}
      <div class="page-type-section">
        <div class="page-type-header">
          <h3>Тип страницы</h3>
          <button class="btn btn-secondary" onclick={openPageTypeSelector}>
            {#if $pageMetadata?.model_name}
              Изменить тип страницы
            {:else}
              Выбрать тип страницы
            {/if}
          </button>
        </div>
        
        {#if $pageMetadata?.model_name}
          <div class="current-page-type">
            <h4>Выбранный тип: {$pageMetadata.verbose_name || $pageMetadata.model_name}</h4>
            <p>Поля формы настроены для этого типа страницы</p>
          </div>
        {:else}
          <div class="no-page-type">
            <p>Тип страницы не выбран</p>
            <span>Выберите тип страницы для настройки полей формы</span>
          </div>
        {/if}
      </div>
    {/if}

    {#if $isEditing && $currentPage}
      <div class="layout-section">
        <div class="layout-header">
          <h3>Раскладка страницы</h3>
          <button class="btn btn-secondary" onclick={openLayoutSelector}>
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
            <div class="layout-actions">
              <a href="/pages/{$currentPage?.id}/components" class="btn btn-primary">
                🧩 Управление компонентами
              </a>
            </div>
          </div>
        {:else}
          <div class="no-layout">
            <p>Раскладка не выбрана</p>
            <span>Выберите раскладку для размещения компонентов на странице</span>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if $currentPage && $isEditing}
    <PagePreview slug={$currentPage.slug} pageId={$currentPage.id} isDraft={$currentPage.is_draft || $currentPage.draft_parent_id} />
  {/if}

  {#if $isEditing && $currentPage}
    <div style="margin: 16px 0; text-align: right;">
      <button class="btn btn-secondary" onclick={() => pageActions.loadPage($currentPage.id!)}>
        Обновить предпросмотр
      </button>
      <button class="btn btn-primary" style="margin-left: 8px;" onclick={handlePublish}>
        Опубликовать версию
      </button>
    </div>
  {/if}

  {#if $error}
    <div class="error-banner">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{$error}</span>
        <button class="error-close" onclick={() => pageActions.clearError()}>
          ✕
        </button>
      </div>
    </div>
  {/if}

  {#if $pageMetadata?.model_name}
    {#if $pageMetadata?.fields}
      {#if $currentPage !== null}
        <TranslatedDynamicForm
          fields={$pageMetadata.fields}
          translation={$pageMetadata.translation}
          initialData={$currentPage}
          onSubmit={handleSave}
          onSaveAsDraft={handleSaveAsDraft}
          onCancel={handleCancel}
          loading={$loading}
        />
      {/if}
    {:else if $loading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Загрузка метаданных...</p>
      </div>
    {:else}
      <div class="error-state">
        <p>❌ Не удалось загрузить метаданные формы</p>
        <button class="btn btn-primary" onclick={() => pageActions.reloadMetadata()}>
          Попробовать снова
        </button>
      </div>
    {/if}
  {/if}

  <!-- Модальное окно выбора раскладки -->
  {#if showLayoutSelector}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="modal-overlay" onclick={closeLayoutSelector} onkeydown={(e) => e.key === 'Escape' && closeLayoutSelector()} role="dialog" aria-modal="true" tabindex="0" aria-label="Выбор раскладки">
      <div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && closeLayoutSelector()} role="document">
        <div class="modal-header">
          <h2>Выбор раскладки</h2>
          <button class="modal-close" onclick={closeLayoutSelector}>✕</button>
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
              <button class="btn btn-primary" onclick={() => layoutActions.reloadLayouts()}>
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
                  onclick={() => selectedLayoutId = layout.id}
                  onkeydown={(e) => e.key === 'Enter' && (selectedLayoutId = layout.id)}
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
          <button class="btn btn-secondary" onclick={closeLayoutSelector}>
            Отмена
          </button>
          <button 
            class="btn btn-primary" 
            onclick={applyLayout}
            disabled={!selectedLayoutId || $layoutLoading}
          >
            Применить раскладку
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Модальное окно выбора типа страницы -->
  {#if showPageTypeSelector}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="modal-overlay" onclick={closePageTypeSelector} onkeydown={(e) => e.key === 'Escape' && closePageTypeSelector()} role="dialog" aria-modal="true" tabindex="0" aria-label="Выбор типа страницы">
      <div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && closePageTypeSelector()} role="document">
        <div class="modal-header">
          <h2>Выбор типа страницы</h2>
          <button class="modal-close" onclick={closePageTypeSelector}>✕</button>
        </div>
        
        <div class="modal-body">
          {#if $loading}
            <div class="loading-state">
              <div class="loading-spinner"></div>
              <p>Загрузка типов страниц...</p>
            </div>
          {:else if $error}
            <div class="error-state">
              <p>❌ {$error}</p>
              <button class="btn btn-primary" onclick={() => pageActions.reloadMetadata()}>
                Попробовать снова
              </button>
            </div>
          {:else if $availablePageTypes.length === 0}
            <div class="empty-state">
              <p>📄 Типы страниц не найдены</p>
              <span>Доступные типы страниц не загружены</span>
            </div>
          {:else}
            <div class="page-types-grid">
              {#each $availablePageTypes as pageType (pageType.model_name)}
                <div 
                  class="page-type-card"
                  class:selected={selectedPageType === pageType.model_name}
                  onclick={() => selectedPageType = pageType.model_name}
                  onkeydown={(e) => e.key === 'Enter' && (selectedPageType = pageType.model_name)}
                  role="button"
                  tabindex="0"
                >
                  <div class="page-type-info">
                    <h4>{pageType.verbose_name || pageType.model_name}</h4>
                    <p>Модель: {pageType.model_name}</p>
                    <span class="page-type-fields">{pageType.fields.length} полей</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick={closePageTypeSelector}>
            Отмена
          </button>
          <button 
            class="btn btn-primary" 
            onclick={applyPageType}
            disabled={!selectedPageType || $loading}
          >
            Применить тип страницы
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Компонент уведомлений -->
  {#if $notification}
    <Notification
      type={$notification.type}
      message={$notification.message}
      show={$notification.show}
      on:hide={() => pageActions.hideNotification()}
    />
  {/if}
</div>

<style>
  .page-editor {
    max-width: 1000px;
    margin: 0 auto;
    padding: var(--space-6);
    padding-top: 0;
  }

  .editor-header {
    text-align: center;
    margin-bottom: var(--space-6);
  }

  /* Стили для отображения дат в шапке */
  .page-dates {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    padding: var(--space-3) var(--space-4);
    margin-bottom: var(--space-4);
    display: flex;
    justify-content: center;
    gap: var(--space-5);
    flex-wrap: wrap;
    box-shadow: var(--shadow-sm);
  }

  .date-info {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.875rem;
  }

  .date-label {
    color: var(--color-muted);
    font-weight: 500;
  }

  .date-value {
    color: var(--color-text);
    font-weight: 600;
    background: var(--color-surface);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-1);
    border: 1px solid var(--color-border);
  }

  .editor-header p {
    color: var(--color-muted);
    font-size: 1rem;
  }

  .error-banner {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius-2);
    margin-bottom: var(--space-6);
  }

  .error-content {
    display: flex;
    align-items: center;
    padding: var(--space-3);
    gap: var(--space-2);
  }

  .error-icon {
    font-size: 1.25rem;
  }

  .error-text {
    flex: 1;
    color: var(--color-danger);
    font-weight: 500;
  }

  .error-close {
    background: none;
    border: none;
    color: var(--color-danger);
    cursor: pointer;
    font-size: 1.1rem;
    padding: var(--space-1);
    border-radius: var(--radius-1);
    transition: background-color 0.15s ease-in-out;
  }

  .error-close:hover {
    background-color: rgba(220, 38, 38, 0.1);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-6) var(--space-4);
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
    padding: var(--space-6) var(--space-4);
    color: var(--color-muted);
  }

  .error-state p {
    font-size: 1rem;
    margin-bottom: var(--space-4);
  }

  /* Локальные стили кнопок удалены — используются глобальные .btn */

  /* Стили для секции раскладки */
  .layout-section {
    padding: var(--space-4);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    box-shadow: var(--shadow-sm);
  }

  .layout-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .layout-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .current-layout h4 {
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: var(--space-3);
  }

  .layout-actions {
    margin-top: var(--space-3);
    text-align: center;
  }

  .no-layout {
    text-align: center;
    padding: var(--space-5);
    color: var(--color-muted);
  }

  .no-layout p {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: var(--space-2);
  }

  .no-layout span {
    font-size: 0.875rem;
  }

  /* Стили для модального окна */
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
    padding: 1rem;
  }

  .modal-content {
    background: var(--color-surface);
    border-radius: var(--radius-2);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 800px;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--color-muted);
    cursor: pointer;
    padding: var(--space-1);
    border-radius: var(--radius-1);
    transition: background-color 0.15s ease-in-out;
  }

  .modal-close:hover {
    background-color: #f3f4f6;
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: var(--space-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .layouts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-3);
  }

  .layout-card {
    border: 2px solid var(--color-border);
    border-radius: var(--radius-2);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .layout-card:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .layout-card.selected {
    border-color: var(--color-primary);
    background: rgba(37, 99, 235, 0.05);
  }

  .layout-preview-small {
    height: 120px;
    overflow: hidden;
  }

  .layout-info {
    padding: var(--space-3);
  }

  .layout-info h4 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
  }

  .layout-info p {
    font-size: 0.875rem;
    color: var(--color-muted);
    margin: 0 0 0.5rem 0;
    line-height: 1.4;
  }

  .layout-zones {
    font-size: 0.75rem;
    color: var(--color-muted);
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    display: inline-block;
  }

  .empty-state {
    text-align: center;
    padding: var(--space-6) var(--space-3);
    color: var(--color-muted);
  }

  .empty-state p {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: var(--space-2);
  }

  .empty-state span {
    font-size: 0.875rem;
  }

  /* Стили для секции типа страницы */
  .page-type-section {
    padding: var(--space-4);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    margin-bottom: var(--space-4);
    box-shadow: var(--shadow-sm);
  }

  .page-type-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-3);
  }

  .page-type-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .current-page-type h4 {
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: 0.5rem;
  }

  .current-page-type p {
    font-size: 0.875rem;
    color: var(--color-muted);
    margin: 0;
  }


  /* Стили для сетки типов страниц */
  .page-types-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-3);
  }

  .page-type-card {
    border: 2px solid var(--color-border);
    border-radius: var(--radius-2);
    padding: var(--space-4);
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .page-type-card:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .page-type-card.selected {
    border-color: var(--color-primary);
    background: rgba(37, 99, 235, 0.05);
  }

  .page-type-info h4 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
  }

  .page-type-info p {
    font-size: 0.875rem;
    color: var(--color-muted);
    margin: 0 0 0.5rem 0;
  }

  .page-type-fields {
    font-size: 0.75rem;
    color: var(--color-muted);
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    display: inline-block;
  }

  .no-page-type {
    text-align: center;
    padding: var(--space-5);
    color: var(--color-muted);
  }

  .no-page-type p {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: var(--space-2);
  }

  .no-page-type span {
    font-size: 0.875rem;
  }
</style>
