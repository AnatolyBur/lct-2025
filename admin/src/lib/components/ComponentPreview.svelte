<!-- Предварительный просмотр компонента -->
<script lang="ts">
  import type { Component, ComponentInstance } from '$lib/types/page';
  import { FRONTEND_BASE_URL } from '$lib/runtimeConfig';
  import { safeJsonBtoa } from '$lib/utils/encoding';

  export let component: Component;
  export let data: Record<string, any> = {};

  // Получение HTML для рендеринга
  // $: componentHtml = renderComponent();

  $: iframeData = `${FRONTEND_BASE_URL}preview-component?__type_component=${component.type}&__data_component=${safeJsonBtoa(data)}`;
  $: console.log('iframeData', iframeData)
</script>

<div class="component-preview">
  <div class="preview-header">
    <h4>Предварительный просмотр</h4>
    <span class="component-type-badge">{component.type}</span>
  </div>
  
  <div class="preview-content">
    <iframe width="100%" height="300px" title="Предварительный просмотр" src={iframeData}></iframe>
  </div>
</div>

<style>
  .component-preview {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #f8f9fa;
    overflow: hidden;
  }

  .preview-header {
    background: #e9ecef;
    padding: 10px 15px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .preview-header h4 {
    margin: 0;
    font-size: 14px;
    color: #495057;
  }

  .component-type-badge {
    background: #007bff;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
  }

  .preview-content {
    padding: 15px;
    background: white;
    min-height: 100px;
  }

  /* Стили для контентных компонентов */
  .content-component {
    padding: 15px;
    border: 1px dashed #ccc;
    border-radius: 4px;
  }

  .content-text {
    font-family: inherit;
    line-height: 1.5;
  }

  /* Стили для медиа компонентов */
  .media-component {
    padding: 15px;
    border: 1px dashed #ccc;
    border-radius: 4px;
  }

  .media-placeholder {
    text-align: center;
    padding: 30px;
    color: #666;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }

  .gallery-item {
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }

  .gallery-item img {
    width: 100%;
    height: 100px;
    object-fit: cover;
  }

  .caption {
    padding: 5px;
    font-size: 12px;
    background: #f8f9fa;
    text-align: center;
  }

  /* Стили для форм */
  .form-component {
    padding: 15px;
    border: 1px dashed #ccc;
    border-radius: 4px;
  }

  .form-title {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #333;
  }

  .preview-form {
    margin-bottom: 10px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background: #f8f9fa;
  }

  .form-group textarea {
    height: 80px;
    resize: vertical;
  }

  .preview-form button {
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0.6;
  }

  .form-info {
    color: #666;
    font-size: 12px;
  }

  /* Стили для раскладок */
  .layout-component {
    padding: 15px;
    border: 1px dashed #ccc;
    border-radius: 4px;
  }

  .layout-placeholder {
    text-align: center;
    padding: 30px;
    color: #666;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .layout-info {
    margin-top: 10px;
  }

  /* Стили для общих компонентов */
  .generic-component {
    padding: 15px;
    border: 1px dashed #ccc;
    border-radius: 4px;
  }

  .component-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e0e0e0;
  }

  .component-header h4 {
    margin: 0;
    color: #333;
  }

  .component-type {
    background: #6c757d;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
  }

  .component-data {
    font-size: 13px;
  }

  .data-item {
    margin-bottom: 5px;
  }

  .data-item strong {
    color: #495057;
  }

</style>
