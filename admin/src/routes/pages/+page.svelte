<!-- Страница со списком страниц -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import PageList from '$lib/components/PageList.svelte';
  import Notification from '$lib/components/Notification.svelte';
  import { 
    pageActions,
    notification 
  } from '$lib/stores/pageStore';
  import type { PageData } from '$lib/types/page';

  // Загрузка страниц при монтировании
  onMount(() => {
    pageActions.loadPages();
    pageActions.startView();
  });

  // Обработка выбора страницы для редактирования
  function handlePageSelect(page: PageData) {
    goto(`/pages/${page.id}/edit`);
  }

  // Обработка создания новой страницы
  function handlePageCreate() {
    goto('/pages/new');
  }
</script>

<svelte:head>
  <title>Страницы - GarpixCMS Admin</title>
  <meta name="description" content="Управление страницами в GarpixCMS" />
</svelte:head>

<div class="pages-container">
  <div class="page-header">
    <div class="header-content">
      <div class="breadcrumbs">
        <span class="breadcrumb-current">📄 Страницы</span>
      </div>
      
      <div class="header-main">
        <div class="header-text">
          <h1 class="page-title">
            <span class="page-icon">📄</span>
            Управление страницами
          </h1>
          
          <p class="page-description">
            Создавайте, редактируйте и управляйте страницами вашего сайта. 
            Используйте кнопку "Создать страницу" для добавления нового контента.
          </p>
        </div>
        
        <div class="header-actions">
          <button 
            class="btn btn-primary btn-large"
            on:click={handlePageCreate}
          >
            <span class="btn-icon">➕</span>
            Создать страницу
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="page-content">
    <PageList 
      onPageSelect={handlePageSelect}
      onPageCreate={handlePageCreate}
    />
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
  .pages-container {
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

  .breadcrumb-current {
    color: #374151;
    font-weight: 500;
  }

  .header-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .header-text {
    flex: 1;
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
    max-width: 600px;
  }

  .header-actions {
    flex-shrink: 0;
  }

  .page-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem 2rem 2rem;
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

  .btn-large {
    padding: 1rem 2rem;
    font-size: 1.125rem;
  }

  .btn-icon {
    font-size: 1.25rem;
  }

  @media (max-width: 768px) {
    .header-main {
      flex-direction: column;
      align-items: stretch;
    }

    .header-actions {
      margin-top: 1rem;
    }

    .page-title {
      font-size: 1.875rem;
    }

    .page-description {
      font-size: 1rem;
    }
  }
</style>
