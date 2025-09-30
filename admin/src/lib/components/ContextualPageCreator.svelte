<!-- Компонент для создания страницы с определением контекста -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { pageCreationService, type PageCreationContext, type ComponentContext } from '$lib/services/pageCreationService';
  import { apiClient } from '$lib/api/client';
  import Notification from './Notification.svelte';
  import type { Component } from '$lib/types/page';

  // Пропсы
  export let onSuccess: (pageId: number) => void = () => {};
  export let onCancel: () => void = () => {};

  // Состояние
  let loading = false;
  let step = 1; // Текущий шаг создания
  let notification = { show: false, type: 'info' as 'success' | 'error' | 'warning' | 'info', message: '' };
  let availableComponents: Component[] = [];

  // Данные формы
  let pageContext: PageCreationContext = {
    title: '',
    content: '',
    seo: {
      title: '',
      description: '',
      keywords: '',
      author: '',
      ogType: 'website'
    },
    publication: {
      isActive: true,
      isPublished: false,
      displayOnSitemap: true,
      sites: [1]
    },
    components: []
  };

  let selectedComponent: Component | null = null;
  let componentData: Record<string, any> = {};

  // Загрузка доступных компонентов
  onMount(async () => {
    try {
      const componentsMetadata = await apiClient.getAllComponentsMetadata();
      // Преобразуем метаданные в формат Component
      availableComponents = componentsMetadata.map(meta => ({
        id: meta.model_name,
        name: meta.verbose_name || meta.model_name,
        type: meta.app_label || 'default',
        config: {},
        fields: meta.fields || []
      }));
    } catch (error) {
      console.error('Ошибка загрузки компонентов:', error);
    }
  });

  // Обработчики
  function showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string) {
    notification = { show: true, type, message };
    setTimeout(() => {
      notification.show = false;
    }, 5000);
  }

  function nextStep() {
    if (step < 4) step++;
  }

  function prevStep() {
    if (step > 1) step--;
  }

  function addComponent() {
    if (!selectedComponent) return;

    const componentContext: ComponentContext = {
      componentId: selectedComponent.id,
      data: { ...componentData },
      viewOrder: pageContext.components.length + 1
    };

    pageContext.components.push(componentContext);
    const componentName = selectedComponent?.name || 'Компонент';
    selectedComponent = null;
    componentData = {};
    
    showNotification('success', `Компонент "${componentName}" добавлен`);
  }

  function removeComponent(index: number) {
    pageContext.components.splice(index, 1);
    showNotification('info', 'Компонент удален');
  }

  async function createPage() {
    try {
      loading = true;
      const result = await pageCreationService.createPageWithContext(pageContext);
      
      if (result.success && result.page) {
        showNotification('success', 'Страница успешно создана!');
        setTimeout(() => {
          onSuccess(result.page!.id!);
        }, 1500);
      } else {
        showNotification('error', result.error || 'Ошибка создания страницы');
      }
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      loading = false;
    }
  }

  function generateSeoFromTitle() {
    if (pageContext.title) {
      pageContext.seo.title = `${pageContext.title} | НазваниеСайта`;
      pageContext.seo.description = `Подробная информация о ${pageContext.title.toLowerCase()}.`;
    }
  }

  // Автогенерация slug
  $: if (pageContext.title) {
    pageContext.slug = pageContext.title
      .toLowerCase()
      .replace(/[^a-zа-я0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
</script>

<div class="contextual-page-creator">
  <div class="header">
    <h2>🛠️ Создание страницы с контекстом</h2>
    <p>Пошаговое создание страницы с настройкой SEO и компонентов</p>
  </div>

  <!-- Прогресс-бар -->
  <div class="progress-bar">
    <div class="progress-steps">
      {#each [1, 2, 3, 4] as stepNumber}
        <div class="step {stepNumber <= step ? 'active' : ''} {stepNumber < step ? 'completed' : ''}">
          <span class="step-number">{stepNumber}</span>
          <span class="step-label">
            {#if stepNumber === 1}Основная информация
            {:else if stepNumber === 2}SEO настройки
            {:else if stepNumber === 3}Компоненты
            {:else}Публикация
            {/if}
          </span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Шаг 1: Основная информация -->
  {#if step === 1}
    <div class="step-content">
      <h3>📝 Основная информация о странице</h3>
      
      <div class="form-group">
        <label for="title">Название страницы *</label>
        <input 
          id="title"
          type="text" 
          bind:value={pageContext.title}
          placeholder="Введите название страницы"
          maxlength="255"
          required
        />
        <small>Максимум 255 символов</small>
      </div>

      <div class="form-group">
        <label for="slug">ЧПУ (URL)</label>
        <input 
          id="slug"
          type="text" 
          bind:value={pageContext.slug}
          placeholder="url-stranitsy"
        />
        <small>Генерируется автоматически из названия</small>
      </div>

      <div class="form-group">
        <label for="content">Содержимое страницы *</label>
        <textarea 
          id="content"
          bind:value={pageContext.content}
          placeholder="Введите основное содержимое страницы"
          rows="6"
          required
        ></textarea>
      </div>

      <div class="form-group">
        <label for="parent">Родительская страница</label>
        <select id="parent" bind:value={pageContext.publication.parentPageId}>
          <option value={undefined}>Нет (корневая страница)</option>
          <!-- Здесь можно добавить список родительских страниц -->
        </select>
      </div>
    </div>
  {/if}

  <!-- Шаг 2: SEO настройки -->
  {#if step === 2}
    <div class="step-content">
      <h3>🔍 SEO настройки</h3>
      
      <div class="seo-helper">
        <button type="button" on:click={generateSeoFromTitle} class="btn-secondary">
          🪄 Автогенерация SEO из названия
        </button>
      </div>

      <div class="form-group">
        <label for="seo-title">SEO заголовок</label>
        <input 
          id="seo-title"
          type="text" 
          bind:value={pageContext.seo.title}
          placeholder="SEO заголовок для поисковых систем"
          maxlength="250"
        />
        <small>Максимум 250 символов. Если не указан, используется обычный заголовок</small>
      </div>

      <div class="form-group">
        <label for="seo-description">SEO описание</label>
        <textarea 
          id="seo-description"
          bind:value={pageContext.seo.description}
          placeholder="Краткое описание страницы для поисковых систем"
          rows="3"
          maxlength="500"
        ></textarea>
        <small>Рекомендуется 150-160 символов</small>
      </div>

      <div class="form-group">
        <label for="seo-keywords">SEO ключевые слова</label>
        <input 
          id="seo-keywords"
          type="text" 
          bind:value={pageContext.seo.keywords}
          placeholder="ключевые слова, через запятую"
        />
      </div>

      <div class="form-group">
        <label for="seo-author">SEO автор</label>
        <input 
          id="seo-author"
          type="text" 
          bind:value={pageContext.seo.author}
          placeholder="Автор страницы"
        />
      </div>

      <div class="form-group">
        <label for="seo-og-type">Тип Open Graph</label>
        <select id="seo-og-type" bind:value={pageContext.seo.ogType}>
          <option value="website">website</option>
          <option value="article">article</option>
          <option value="product">product</option>
        </select>
      </div>
    </div>
  {/if}

  <!-- Шаг 3: Компоненты -->
  {#if step === 3}
    <div class="step-content">
      <h3>🧩 Компоненты страницы</h3>
      
      <!-- Добавление нового компонента -->
      <div class="component-adder">
        <h4>Добавить компонент</h4>
        
        <div class="form-group">
          <label for="component-select">Выберите компонент</label>
          <select id="component-select" bind:value={selectedComponent} on:change={() => componentData = {}}>
            <option value={null}>Выберите компонент</option>
            {#each availableComponents as component}
              <option value={component}>{component.name} ({component.type})</option>
            {/each}
          </select>
        </div>

        {#if selectedComponent}
          <div class="component-config">
            <h5>Настройка: {selectedComponent.name}</h5>
            
            {#each selectedComponent.fields as field}
              <div class="form-group">
                <label for="field-{field.name}">{field.verbose_name || field.name} {field.required ? '*' : ''}</label>
                
                {#if field.type === 'TextField'}
                  <textarea 
                    id="field-{field.name}"
                    bind:value={componentData[field.name]}
                    placeholder={field.help_text}
                    rows="3"
                    required={field.required}
                  ></textarea>
                {:else if field.type === 'BooleanField'}
                  <input 
                    id="field-{field.name}"
                    type="checkbox" 
                    bind:checked={componentData[field.name]}
                  />
                {:else if field.choices}
                  <select id="field-{field.name}" bind:value={componentData[field.name]}>
                    <option value="">Выберите значение</option>
                    {#each field.choices as choice}
                      <option value={choice.value}>{choice.label}</option>
                    {/each}
                  </select>
                {:else}
                  <input 
                    id="field-{field.name}"
                    type="text" 
                    bind:value={componentData[field.name]}
                    placeholder={field.help_text}
                    required={field.required}
                  />
                {/if}
                
                {#if field.help_text}
                  <small>{field.help_text}</small>
                {/if}
              </div>
            {/each}

            <button type="button" on:click={addComponent} class="btn-primary">
              ➕ Добавить компонент
            </button>
          </div>
        {/if}
      </div>

      <!-- Список добавленных компонентов -->
      <div class="components-list">
        <h4>Добавленные компоненты</h4>
        
        {#if pageContext.components.length === 0}
          <p class="no-components">Компоненты не добавлены</p>
        {:else}
          {#each pageContext.components as component, index}
            <div class="component-item">
              <div class="component-info">
                <strong>{availableComponents.find(c => c.id === component.componentId)?.name || component.componentId}</strong>
                <span class="component-order">Порядок: {component.viewOrder}</span>
              </div>
              <button type="button" on:click={() => removeComponent(index)} class="btn-danger">
                🗑️ Удалить
              </button>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}

  <!-- Шаг 4: Публикация -->
  {#if step === 4}
    <div class="step-content">
      <h3>📢 Настройки публикации</h3>
      
      <div class="form-group">
        <label>
          <input type="checkbox" bind:checked={pageContext.publication.isActive} />
          Страница активна (включена)
        </label>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" bind:checked={pageContext.publication.isPublished} />
          Опубликовать страницу сразу
        </label>
        <small>Если не отмечено, страница будет создана как черновик</small>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" bind:checked={pageContext.publication.displayOnSitemap} />
          Отображать в карте сайта (sitemap.xml)
        </label>
      </div>

      <div class="form-group">
        <label for="sites">Сайты для отображения</label>
        <select id="sites" multiple bind:value={pageContext.publication.sites}>
          <option value={1}>Основной сайт</option>
          <!-- Здесь можно добавить другие сайты -->
        </select>
        <small>Удерживайте Ctrl для выбора нескольких сайтов</small>
      </div>

      <!-- Предварительный просмотр -->
      <div class="preview-section">
        <h4>📋 Предварительный просмотр</h4>
        <div class="preview-card">
          <h5>{pageContext.title || 'Название страницы'}</h5>
          <p><strong>URL:</strong> /{pageContext.slug || 'url-stranitsy'}</p>
          <p><strong>SEO заголовок:</strong> {pageContext.seo.title || pageContext.title}</p>
          <p><strong>Компонентов:</strong> {pageContext.components.length}</p>
          <p><strong>Статус:</strong> {pageContext.publication.isPublished ? 'Опубликована' : 'Черновик'}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Навигация -->
  <div class="navigation">
    <button type="button" on:click={prevStep} disabled={step === 1} class="btn-secondary">
      ← Назад
    </button>
    
    <div class="step-indicator">
      Шаг {step} из 4
    </div>
    
    {#if step < 4}
      <button type="button" on:click={nextStep} class="btn-primary">
        Далее →
      </button>
    {:else}
      <button type="button" on:click={createPage} disabled={loading} class="btn-success">
        {loading ? '⏳ Создание...' : '✅ Создать страницу'}
      </button>
    {/if}
  </div>

  <!-- Кнопка отмены -->
  <div class="cancel-section">
    <button type="button" on:click={onCancel} class="btn-outline">
      ❌ Отмена
    </button>
  </div>

  <!-- Уведомления -->
  {#if notification.show}
    <Notification 
      type={notification.type}
      message={notification.message}
      show={notification.show}
      on:hide={() => notification.show = false}
    />
  {/if}
</div>

<style>
  .contextual-page-creator {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .header {
    text-align: center;
    margin-bottom: 30px;
  }

  .header h2 {
    color: #2c3e50;
    margin-bottom: 10px;
  }

  .progress-bar {
    margin-bottom: 30px;
  }

  .progress-steps {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .step.active {
    background-color: #3498db;
    color: white;
  }

  .step.completed {
    background-color: #27ae60;
    color: white;
  }

  .step-number {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: #ecf0f1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .step.active .step-number,
  .step.completed .step-number {
    background-color: white;
    color: inherit;
  }

  .step-label {
    font-size: 12px;
    text-align: center;
  }

  .step-content {
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 30px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #2c3e50;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 12px;
    border: 2px solid #ecf0f1;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.3s ease;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3498db;
  }

  .form-group small {
    display: block;
    margin-top: 5px;
    color: #7f8c8d;
    font-size: 12px;
  }

  .seo-helper {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
  }

  .component-adder {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .component-config {
    margin-top: 15px;
    padding: 15px;
    background-color: white;
    border-radius: 6px;
  }

  .components-list {
    margin-top: 20px;
  }

  .component-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: white;
    border: 1px solid #ecf0f1;
    border-radius: 6px;
    margin-bottom: 10px;
  }

  .component-order {
    font-size: 12px;
    color: #7f8c8d;
    margin-left: 10px;
  }

  .no-components {
    text-align: center;
    color: #7f8c8d;
    font-style: italic;
    padding: 20px;
  }

  .preview-section {
    margin-top: 20px;
  }

  .preview-card {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #3498db;
  }

  .navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .step-indicator {
    font-weight: 600;
    color: #2c3e50;
  }

  .cancel-section {
    text-align: center;
  }

  .btn-primary, .btn-secondary, .btn-success, .btn-danger, .btn-outline {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-primary {
    background-color: #3498db;
    color: white;
  }

  .btn-primary:hover {
    background-color: #2980b9;
  }

  .btn-secondary {
    background-color: #95a5a6;
    color: white;
  }

  .btn-success {
    background-color: #27ae60;
    color: white;
  }

  .btn-danger {
    background-color: #e74c3c;
    color: white;
  }

  .btn-outline {
    background-color: transparent;
    color: #e74c3c;
    border: 2px solid #e74c3c;
  }

  .btn-outline:hover {
    background-color: #e74c3c;
    color: white;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
