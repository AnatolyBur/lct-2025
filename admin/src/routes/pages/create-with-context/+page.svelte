<!-- Страница создания страницы с контекстом -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import ContextualPageCreator from '$lib/components/ContextualPageCreator.svelte';

  function handleSuccess(pageId: number) {
    // Переход к редактированию созданной страницы
    goto(`/pages/${pageId}/edit`);
  }

  function handleCancel() {
    // Возврат к списку страниц
    goto('/pages');
  }
</script>

<svelte:head>
  <title>Создание страницы с контекстом - GarpixCMS Admin</title>
  <meta name="description" content="Пошаговое создание страницы с настройкой SEO и компонентов" />
</svelte:head>

<div class="page-container">
  <div class="breadcrumbs">
    <a href="/pages" class="breadcrumb-link">📄 Страницы</a>
    <span class="breadcrumb-separator">›</span>
    <span class="breadcrumb-current">Создание с контекстом</span>
  </div>

  <ContextualPageCreator 
    onSuccess={handleSuccess}
    onCancel={handleCancel}
  />
</div>

<style>
  .page-container {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .breadcrumbs {
    padding: 20px;
    background-color: white;
    border-bottom: 1px solid #ecf0f1;
  }

  .breadcrumb-link {
    color: #3498db;
    text-decoration: none;
  }

  .breadcrumb-link:hover {
    text-decoration: underline;
  }

  .breadcrumb-separator {
    margin: 0 10px;
    color: #7f8c8d;
  }

  .breadcrumb-current {
    color: #2c3e50;
    font-weight: 600;
  }
</style>

