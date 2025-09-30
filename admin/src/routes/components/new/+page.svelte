<!-- Страница создания нового компонента -->
<script lang="ts">
  import { onMount } from 'svelte';
  import ComponentEditor from '$lib/components/ComponentEditor.svelte';
  import Notification from '$lib/components/Notification.svelte';
  import { 
    componentEditMode,
    componentNotification,
    componentActions
  } from '$lib/stores/componentStore';

  // Инициализация режима создания при монтировании
  onMount(() => {
    componentActions.startCreate();
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
  <title>Создание компонента - Админ панель</title>
</svelte:head>

<div class="component-create-page">
  <ComponentEditor 
    onCancel={handleCloseEditor}
  />

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
  .component-create-page {
    min-height: 100vh;
    background: #f8f9fa;
  }
</style>
