<!-- Страница редактирования компонента -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import ComponentEditor from '$lib/components/ComponentEditor.svelte';
  import Notification from '$lib/components/Notification.svelte';
  import { 
    currentComponent,
    componentEditMode,
    componentNotification,
    componentActions,
    componentLoading
  } from '$lib/stores/componentStore';

  // Получаем ID компонента из параметров маршрута
  $: componentId = $page.params.id;

  // Загрузка компонента при монтировании
  onMount(() => {
    if (componentId) {
      componentActions.loadComponentInstance(componentId);
    }
  });

  // Обработка закрытия редактора
  function handleCloseEditor() {
    // Переходим на главную страницу компонентов
    window.location.href = '/components';
  }

  // Обработка скрытия уведомления
  function handleHideNotification() {
    componentActions.hideNotification();
  }
</script>

<svelte:head>
  <title>Редактирование компонента - Админ панель</title>
</svelte:head>

<div class="component-edit-page">
  {#if $componentLoading}
    <div class="loading">
      <p>Загрузка компонента...</p>
    </div>
  {:else if $currentComponent}
    <ComponentEditor 
      onCancel={handleCloseEditor}
    />
  {:else}
    <div class="error-state">
      <h2>Компонент не найден</h2>
      <p>Компонент с ID "{componentId}" не существует или был удален.</p>
      <a href="/components" class="btn btn-primary">Вернуться к списку</a>
    </div>
  {/if}

  <!-- Уведомления -->
  {#if $componentNotification}
    <Notification 
      type={$componentNotification.type}
      message={$componentNotification.message}
      show={$componentNotification.show}
      onClose={handleHideNotification}
    />
  {/if}
</div>

<style>
  .component-edit-page {
    min-height: 100vh;
    background: #f8f9fa;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 50vh;
    font-size: 1.2em;
    color: #666;
  }

  .error-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 50vh;
    text-align: center;
  }

  .error-state h2 {
    margin: 0 0 15px 0;
    color: #333;
  }

  .error-state p {
    margin: 0 0 20px 0;
    color: #666;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover {
    background: #0056b3;
  }
</style>
