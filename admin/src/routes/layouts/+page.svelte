<!-- Страница управления раскладками -->
<script lang="ts">
  import { onMount } from 'svelte';
  import LayoutEditor from '$lib/components/LayoutEditor.svelte';
  import LayoutPreview from '$lib/components/LayoutPreview.svelte';
  import { 
    layouts,
    currentLayout,
    layoutLoading,
    layoutError,
    layoutActions,
    layoutEditMode,
    isCreatingLayout,
    isEditingLayout,
    isViewingLayout
  } from '$lib/stores/layoutStore';

  // Состояние интерфейса
  let showEditor = false;

  // Загрузка раскладок при монтировании
  onMount(() => {
    layoutActions.loadLayouts();
  });

  // Обработка создания новой раскладки
  function handleCreateLayout() {
    layoutActions.startCreateLayout();
    showEditor = true;
  }

  // Обработка редактирования раскладки
  function handleEditLayout(layoutId: string) {
    layoutActions.loadLayout(layoutId);
    showEditor = true;
  }

  // Обработка удаления раскладки
  async function handleDeleteLayout(layoutId: string) {
    if (confirm('Вы уверены, что хотите удалить эту раскладку?')) {
      try {
        await layoutActions.deleteLayout(layoutId);
      } catch (err) {
        console.error('Ошибка удаления раскладки:', err);
      }
    }
  }

  // Обработка закрытия редактора
  function handleCloseEditor() {
    showEditor = false;
    layoutActions.startViewLayout();
  }

  // Обработка успешного сохранения
  function handleSaveSuccess() {
    showEditor = false;
    layoutActions.startViewLayout();
  }
</script>

<svelte:head>
  <title>Управление раскладками - GarpixCMS Admin</title>
</svelte:head>

<div class="layouts-page">
  <div class="page-header">
    <h1>Управление раскладками</h1>
    <p>Создавайте и редактируйте раскладки для размещения компонентов на страницах</p>
    
    <div class="header-actions">
      <button class="btn btn-primary" on:click={handleCreateLayout}>
        + Создать раскладку
      </button>
    </div>
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

  {#if showEditor && ($isCreatingLayout || $isEditingLayout)}
    <LayoutEditor onCancel={handleCloseEditor} />
  {:else}
    <div class="layouts-content">
      {#if $layoutLoading}
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Загрузка раскладок...</p>
        </div>
      {:else if $layouts.length === 0}
        <div class="empty-state">
          <div class="empty-icon">📐</div>
          <h2>Раскладки не найдены</h2>
          <p>Создайте первую раскладку для начала работы</p>
          <button class="btn btn-primary" on:click={handleCreateLayout}>
            Создать раскладку
          </button>
        </div>
      {:else}
        <div class="layouts-grid">
          {#each $layouts as layout (layout.id)}
            <div class="layout-card">
              <div class="layout-preview">
                <LayoutPreview layout={layout || null} />
              </div>
              
              <div class="layout-info">
                <h3>{layout.name}</h3>
                {#if layout.description}
                  <p class="layout-description">{layout.description}</p>
                {/if}
                
                <div class="layout-meta">
                  <span class="layout-zones">{layout.zones.length} зон</span>
                  <span class="layout-date">
                    {new Date(layout.created_at || '').toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
              
              <div class="layout-actions">
                <button 
                  class="btn btn-secondary btn-sm" 
                  on:click={() => handleEditLayout(layout.id)}
                >
                  Редактировать
                </button>
                <button 
                  class="btn btn-danger btn-sm" 
                  on:click={() => handleDeleteLayout(layout.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .layouts-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .page-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .page-header p {
    color: #6b7280;
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }

  .header-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
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

  .layouts-content {
    min-height: 400px;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: #6b7280;
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .empty-state h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }

  .layouts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
  }

  .layout-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
    transition: all 0.15s ease-in-out;
  }

  .layout-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }

  .layout-preview {
    height: 200px;
    overflow: hidden;
    border-bottom: 1px solid #e5e7eb;
  }

  .layout-info {
    padding: 1.5rem;
  }

  .layout-info h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .layout-description {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.4;
    margin: 0 0 1rem 0;
  }

  .layout-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .layout-zones {
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }

  .layout-actions {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: #f9fafb;
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

  /* Адаптивность */
  @media (max-width: 768px) {
    .layouts-page {
      padding: 1rem;
    }

    .page-header h1 {
      font-size: 2rem;
    }

    .layouts-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .layout-actions {
      flex-direction: column;
    }
  }
</style>
