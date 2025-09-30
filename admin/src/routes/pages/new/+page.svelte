<!-- Страница создания новой страницы -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import PageEditor from '$lib/components/PageEditor.svelte';
  import Notification from '$lib/components/Notification.svelte';
  import { 
    pageMetadata, 
    pageActions,
    notification,
    isCreating 
  } from '$lib/stores/pageStore';

  // Загрузка метаданных при монтировании
  onMount(() => {
    pageActions.loadMetadata();
    pageActions.startCreate();
  });

  // Обработка отмены - возврат к списку страниц
  function handleCancel() {
    pageActions.startView();
    goto('/pages');
  }

  // Обработка успешного создания - переход к редактированию
  function handleSuccess() {
    // Переход произойдет автоматически через store
    goto('/pages');
  }
</script>

<svelte:head>
  <title>Создание страницы - GarpixCMS Admin</title>
  <meta name="description" content="Создание новой страницы в GarpixCMS" />
</svelte:head>

<div class="create-page-container">
  <div class="page-header">
    <div class="header-content">
      <div class="breadcrumbs">
        <a href="/pages" class="breadcrumb-link">📄 Страницы</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Создание страницы</span>
      </div>
      
      <h1 class="page-title">
        <span class="page-icon">➕</span>
        Создание новой страницы
      </h1>
      
      <p class="page-description">
        Заполните форму ниже для создания новой страницы. Все поля с пометкой * обязательны для заполнения.
      </p>
    </div>
  </div>

  <div class="page-content">
    <PageEditor onCancel={handleCancel} />
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
  .create-page-container {
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
</style>
