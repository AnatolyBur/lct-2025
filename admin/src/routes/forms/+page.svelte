<!-- Список форм -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import FormBuilder from '$lib/components/FormBuilder.svelte';
  import { 
    forms,
    loading,
    error,
    notification,
    formBuilderActions
  } from '$lib/stores/formBuilderStore';
  import type { FormBuilderConfig } from '$lib/types/formBuilder';

  // Загрузка форм при монтировании
  onMount(async () => {
    await formBuilderActions.loadForms();
  });

  // Обработка создания новой формы
  function handleCreateForm() {
    goto('/forms/new');
  }

  // Обработка редактирования формы
  function handleEditForm(form: FormBuilderConfig) {
    if (form.id) {
      goto(`/forms/${form.id}`);
    }
  }

  // Обработка удаления формы
  async function handleDeleteForm(form: FormBuilderConfig) {
    if (form.id && confirm(`Вы уверены, что хотите удалить форму "${form.form_title}"?`)) {
      try {
        await formBuilderActions.deleteForm(form.id);
      } catch (err) {
        console.error('Ошибка удаления формы:', err);
      }
    }
  }

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
</script>

<svelte:head>
  <title>Конструктор форм</title>
</svelte:head>

<div class="forms-page">
  <div class="page-header">
    <div class="header-content">
      <h1>Конструктор форм</h1>
      <p>Создавайте и управляйте формами для вашего сайта</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-primary" on:click={handleCreateForm}>
        + Создать форму
      </button>
    </div>
  </div>

  <!-- Уведомления -->
  {#if $notification}
    <div class="notification notification-{$notification.type}">
      <p>{$notification.message}</p>
      <button class="btn-close" on:click={() => notification.set(null)}>
        ✕
      </button>
    </div>
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

  <!-- Контент -->
  {#if $loading}
    <div class="loading">
      <p>Загрузка форм...</p>
    </div>
  {:else if $forms.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📝</div>
      <h2>Формы не найдены</h2>
      <p>Создайте свою первую форму, чтобы начать работу</p>
      <button class="btn btn-primary" on:click={handleCreateForm}>
        Создать форму
      </button>
    </div>
  {:else}
    <div class="forms-grid">
      {#each $forms as form (form.id)}
        <div class="form-card">
          <div class="form-header">
            <div class="form-icon">📝</div>
            <div class="form-info">
              <h3 class="form-title">{form.form_title}</h3>
              <p class="form-description">{form.form_description || 'Без описания'}</p>
            </div>
            <div class="form-status">
              <span class="status-badge {form.is_active ? 'active' : 'inactive'}">
                {form.is_active ? 'Активна' : 'Неактивна'}
              </span>
            </div>
          </div>

          <div class="form-stats">
            <div class="stat-item">
              <span class="stat-label">Поля:</span>
              <span class="stat-value">{form.form_config.fields?.length || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Создана:</span>
              <span class="stat-value">{form.created_at ? formatDate(form.created_at) : '—'}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Изменена:</span>
              <span class="stat-value">{form.updated_at ? formatDate(form.updated_at) : '—'}</span>
            </div>
          </div>

          <div class="form-actions">
            <button 
              class="btn btn-secondary btn-sm"
              on:click={() => handleEditForm(form)}
            >
              Редактировать
            </button>
            <button 
              class="btn btn-danger btn-sm"
              on:click={() => handleDeleteForm(form)}
            >
              Удалить
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .forms-page {
    min-height: 100vh;
    background: #f8fafc;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem;
    background: white;
    border-bottom: 1px solid #e2e8f0;
  }

  .header-content h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    font-weight: 600;
    color: #1a202c;
  }

  .header-content p {
    margin: 0;
    color: #6b7280;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
  }

  .notification {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    margin: 1rem 2rem;
    border-radius: 0.375rem;
    color: white;
  }

  .notification-success {
    background: #10b981;
  }

  .notification-error {
    background: #ef4444;
  }

  .notification-warning {
    background: #f59e0b;
  }

  .notification-info {
    background: #3b82f6;
  }

  .notification p {
    margin: 0;
  }

  .btn-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
  }

  .btn-close:hover {
    background: rgba(255, 255, 255, 0.2);
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

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .empty-state h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
  }

  .empty-state p {
    margin: 0 0 2rem 0;
    color: #6b7280;
    max-width: 400px;
  }

  .forms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
  }

  .form-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.15s ease-in-out;
  }

  .form-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .form-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .form-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .form-info {
    flex: 1;
    min-width: 0;
  }

  .form-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
  }

  .form-description {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }

  .form-status {
    flex-shrink: 0;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-badge.active {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.inactive {
    background: #fee2e2;
    color: #991b1b;
  }

  .form-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: #f9fafb;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }

  .stat-label {
    color: #6b7280;
  }

  .stat-value {
    font-weight: 500;
    color: #374151;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: white;
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

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #dc2626;
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }

  /* Адаптивность */
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .header-actions {
      justify-content: center;
    }

    .forms-grid {
      grid-template-columns: 1fr;
      padding: 1rem;
    }

    .form-header {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    .form-status {
      align-self: flex-start;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>
