<!-- Компонент списка страниц -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { pages, loading, error, pageActions } from '$lib/stores/pageStore';
  import type { PageData } from '$lib/types/page';

  export let onPageSelect: (page: PageData) => void = () => {};
  export let onPageCreate: () => void = () => {};

  // Загрузка страниц при монтировании компонента
  onMount(() => {
    pageActions.loadPages();
  });

  // Форматирование даты
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Обработка удаления страницы
  async function handleDelete(page: PageData, event: Event) {
    event.stopPropagation();
    
    if (confirm(`Вы уверены, что хотите удалить страницу "${page.title}"?`)) {
      try {
        await pageActions.deletePage(page.id!);
      } catch (err) {
        console.error('Ошибка удаления страницы:', err);
      }
    }
  }
</script>

<div class="page-list">
  <div class="page-list-header">
    <h2>Страницы</h2>
  </div>

  {#if $error}
    <div class="error-message">
      <p>❌ {$error}</p>
      <button class="btn btn-secondary" on:click={() => pageActions.clearError()}>
        Закрыть
      </button>
    </div>
  {/if}

  {#if $loading}
    <div class="loading">
      <p>⏳ Загрузка страниц...</p>
    </div>
  {:else if $pages.length === 0}
    <div class="empty-state">
      <p>📄 Страниц пока нет</p>
      <p class="empty-hint">Перейдите на страницу создания, чтобы добавить первую страницу</p>
    </div>
  {:else}
    <div class="pages-grid">
      {#each $pages as page (page.id)}
        <div 
          class="page-card"
          on:click={() => onPageSelect(page)}
          role="button"
          tabindex="0"
        >
          <div class="page-card-header">
            <h3 class="page-title">{page.title}</h3>
            <div class="page-status">
              {#if page.is_published}
                <span class="status published">Опубликована</span>
              {:else}
                <span class="status draft">Черновик</span>
              {/if}
            </div>
          </div>
          
          <div class="page-card-content">
            <p class="page-slug">/{page.slug}</p>
            {#if page.content}
              <p class="page-preview">{page.content.substring(0, 100)}...</p>
            {/if}
          </div>
          
          <div class="page-card-footer">
            <div class="page-meta">
              <span class="page-date">
                Обновлено: {formatDate(page.updated_at || page.created_at || '')}
              </span>
            </div>
            
            <div class="page-actions">
              <button 
                class="btn btn-danger btn-sm"
                on:click={(e) => handleDelete(page, e)}
                disabled={$loading}
                title="Удалить страницу"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page-list {
    padding: 1.5rem;
  }

  .page-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .page-list-header h2 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .error-message {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-message p {
    color: #dc2626;
    margin: 0;
    font-weight: 500;
  }

  .loading {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  .empty-state p {
    font-size: 1.125rem;
    margin-bottom: 1rem;
  }

  .empty-hint {
    font-size: 1rem !important;
    color: #6b7280 !important;
  }

  .pages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .page-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .page-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .page-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .page-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
    flex: 1;
    margin-right: 1rem;
  }

  .page-status {
    flex-shrink: 0;
  }

  .status {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status.published {
    background-color: #dcfce7;
    color: #166534;
  }

  .status.draft {
    background-color: #fef3c7;
    color: #92400e;
  }

  .page-card-content {
    margin-bottom: 1rem;
  }

  .page-slug {
    color: #6b7280;
    font-family: monospace;
    font-size: 0.875rem;
    margin: 0 0 0.5rem 0;
  }

  .page-preview {
    color: #374151;
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
  }

  .page-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
  }

  .page-meta {
    flex: 1;
  }

  .page-date {
    color: #6b7280;
    font-size: 0.75rem;
  }

  .page-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 600;
    font-size: 0.875rem;
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
    background-color: #ef4444;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background-color: #dc2626;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
</style>
