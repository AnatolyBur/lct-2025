<!-- Страница редактирования страницы -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import PageEditor from '$lib/components/PageEditor.svelte';
  import Notification from '$lib/components/Notification.svelte';
  import { 
    pageMetadata, 
    currentPage,
    pageActions,
    notification,
    loading 
  } from '$lib/stores/pageStore';

  // Получение ID страницы из URL
  $: pageId = $page.params.id;

  // Загрузка данных при монтировании
  onMount(async () => {
    if (pageId) {
      await pageActions.loadMetadata();
      await pageActions.loadPage(parseInt(pageId));
    }
  });

  // Обработка отмены - возврат к списку страниц
  function handleCancel() {
    pageActions.startView();
    goto('/pages');
  }

  // Обработка успешного обновления - переход к списку
  function handleSuccess() {
    goto('/pages');
  }
</script>

<svelte:head>
  <title>Редактирование страницы - GarpixCMS Admin</title>
  <meta name="description" content="Редактирование страницы в GarpixCMS" />
</svelte:head>

<div class="edit-page-container">
  <div class="page-header">
    <div class="header-content">
      <div class="breadcrumbs">
        <a href="/pages" class="breadcrumb-link">Страницы</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">
          {#if $currentPage}
            Редактирование: {$currentPage.title}
          {:else}
            Редактирование страницы
          {/if}
        </span>
      </div>
      
      <h1 class="page-title">
        <span class="page-icon">✏️</span>
        {#if $currentPage}
          Редактирование: {$currentPage.title}
        {:else}
          Редактирование страницы
        {/if}
      </h1>
      
      <p class="page-description">
        Внесите изменения в поля ниже. Все изменения будут сохранены при нажатии кнопки "Сохранить".
      </p>
    </div>
  </div>

  <div class="page-content">
    {#if $loading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Загрузка данных страницы...</p>
      </div>
    {:else if $currentPage}
      <PageEditor onCancel={handleCancel} />
    {:else}
      <div class="error-state">
        <p>❌ Страница не найдена</p>
        <a href="/pages" class="btn btn-primary">Вернуться к списку страниц</a>
      </div>
    {/if}
  </div>

  <!-- Уведомления -->
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
  .edit-page-container {
    min-height: 100vh;
    background-color: #f9fafb;
  }

  .page-header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .breadcrumb-link {
    color: #3b82f6;
    text-decoration: none;
    transition: color 0.15s ease-in-out;
  }

  .breadcrumb-link:hover {
    color: #2563eb;
    text-decoration: underline;
  }

  .breadcrumb-separator {
    color: #9ca3af;
  }

  .breadcrumb-current {
    color: #374151;
    font-weight: 500;
  }

  .page-title {
    font-size: 2.25rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .page-icon {
    font-size: 2rem;
  }

  .page-description {
    color: #6b7280;
    font-size: 1.125rem;
    margin: 0;
    line-height: 1.6;
  }

  .page-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
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

  .error-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #6b7280;
  }

  .error-state p {
    font-size: 1.125rem;
    margin-bottom: 1.5rem;
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

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background-color: #2563eb;
  }
</style>
