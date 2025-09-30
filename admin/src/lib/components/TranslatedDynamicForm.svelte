<!-- Компонент динамической формы с поддержкой переводов по табам -->
<script lang="ts">
  import { onMount } from 'svelte';
  import DynamicField from './DynamicField.svelte';
  import type { BasePageField, PageData, Language, TranslationInfo } from '$lib/types/page';
  import { createInitialFormData, validateFormData, generateSlugFromTitle } from '$lib/utils/form';
  import { apiClient } from '$lib/api/client';

  export let fields: BasePageField[] = [];
  export let translation: TranslationInfo | null = null;
  export let initialData: PageData | null = null;
  export let onSubmit: (data: PageData) => void = () => {};
  export let onSaveAsDraft: (data: PageData) => void = () => {};
  export let onCancel: () => void = () => {};
  export let loading: boolean = false;

  let formData: PageData = {} as PageData;
  let errors: Record<string, string> = {};
  let isSubmitting = false;
  let activeLanguageTab: string = '';
  let siteBaseUrl: string = '';
  let fullUrl: string = '';
  let isFormInitialized: boolean = false;
  let isDirty: boolean = false;
  let lastInitialId: number | null = null;
  
  // Реактивные переменные для отладки
  $: debugFormData = formData;
  $: debugDataToSubmit = getDataToSubmit();
  $: debugErrors = errors;
  
  // Реактивная переменная для URL (резервная)
  $: if (siteBaseUrl && formData?.slug) {
    fullUrl = `${siteBaseUrl}/${formData.slug}`;
  }
  

  // Инициализация данных формы
  onMount(async () => {
    if (initialData) {
      formData = { ...initialData };
      isFormInitialized = true;
      lastInitialId = (initialData as any).id ?? null;
    } else {
      formData = createInitialFormData(fields, translation || undefined);
      isFormInitialized = true;
      lastInitialId = null;
    }
    
    // Нормализуем данные: заменяем null на пустые строки для текстовых полей
    if (translation?.languages) {
      fields.forEach(field => {
        if (field.is_translated && (field.type === 'CharField' || field.type === 'SlugField' || field.type === 'TextField')) {
          translation.languages.forEach(language => {
            const translatedFieldName = `${field.name}_${language.code.replace('-', '_')}`;
            if (formData[translatedFieldName] === null || formData[translatedFieldName] === undefined) {
              formData[translatedFieldName] = '';
            }
          });
        }
      });
    }
    
    // Устанавливаем первый язык как активный
    if (translation?.languages && translation.languages.length > 0) {
      activeLanguageTab = translation.languages[0].code;
    }
    
    // Загружаем базовый URL сайта
    try {
      const siteInfo = await apiClient.getSiteBaseUrl();
      siteBaseUrl = siteInfo.base_url;
      
      // Инициализируем URL если есть slug
      if (formData?.slug) {
        fullUrl = `${siteBaseUrl}/${formData.slug}`;
      } else {
        fullUrl = siteBaseUrl;
      }
    } catch (error) {
      console.error('Ошибка загрузки базового URL:', error);
    }
  });

  // Реактивно обновляем formData при изменении initialData (когда данные приходят с бэкенда позже)
  $: if (initialData && !isDirty && (!isFormInitialized || lastInitialId !== (initialData as any).id)) {
    // Клонируем входные данные
    formData = { ...initialData } as PageData;

    // Нормализуем переводимые текстовые поля: null/undefined -> ''
    if (translation?.languages) {
      fields.forEach(field => {
        if (field.is_translated && (field.type === 'CharField' || field.type === 'SlugField' || field.type === 'TextField')) {
          translation.languages.forEach(language => {
            const translatedFieldName = `${field.name}_${language.code.replace('-', '_')}`;
            if (formData[translatedFieldName] === null || formData[translatedFieldName] === undefined) {
              formData[translatedFieldName] = '';
            }
          });
        }
      });
    }

    // Обновляем отображаемый URL
    if (siteBaseUrl) {
      fullUrl = formData?.slug ? `${siteBaseUrl}/${formData.slug}` : siteBaseUrl;
    }
    isFormInitialized = true;
    lastInitialId = (initialData as any).id ?? null;
    console.log(formData, 'formData initialData')

  }


  // Обработка изменения поля
  function handleFieldChange(event: CustomEvent) {
    const { field, value } = event.detail;
    isDirty = true;
    
    console.log('🔧 handleFieldChange called:', { field, value, currentFormData: formData });
    
    // Нормализуем значение для текстовых полей
    let normalizedValue = value;
    if (typeof value === 'string' || value === null || value === undefined) {
      normalizedValue = value || '';
    }
    
    // Обновляем formData реактивно - используем assignment для правильной реактивности
    formData = {
      ...formData,
      [field]: normalizedValue
    };
    
    console.log('🔧 formData updated:', formData);
    
    // Проверяем, является ли это переводимым полем
    const isTranslatedField = translation?.languages?.some(language => {
      return field.endsWith(`_${language.code.replace('-', '_')}`);
    }) || false;
    
    // Автоматическая генерация slug из title (только для основного поля)
    if (!isTranslatedField && field === 'title' && value && (!formData.slug || formData.slug.trim() === '')) {
      const generatedSlug = generateSlugFromTitle(value);
      formData = {
        ...formData,
        slug: generatedSlug
      };
    }
    
    // Обновляем URL при изменении slug (только для основного поля)
    if (!isTranslatedField && field === 'slug' && siteBaseUrl) {
      fullUrl = value ? `${siteBaseUrl}/${value}` : siteBaseUrl;
    }
    
    // Очистка ошибки для этого поля
    if (errors[field]) {
      errors = { ...errors };
      delete errors[field];
    }
    
    // Если это основное поле (не переводимое), очищаем ошибки для всех его переводов
    if (!isTranslatedField && translation?.languages) {
      translation.languages.forEach(language => {
        const translatedFieldName = `${field}_${language.code.replace('-', '_')}`;
        if (errors[translatedFieldName]) {
          errors = { ...errors };
          delete errors[translatedFieldName];
        }
      });
    }
  }

  // Обработка отправки формы
  async function handleSubmit(event: Event) {
    event.preventDefault();
    console.log('🔧 handleSubmit called:', formData);
    formData.title = formData.title_ru.trim();
    
    // Нормализуем данные перед валидацией
    const normalizedFormData = { ...formData };
    if (translation?.languages) {
      fields.forEach(field => {
        if (field.is_translated && (field.type === 'CharField' || field.type === 'SlugField' || field.type === 'TextField')) {
          translation.languages.forEach(language => {
            const translatedFieldName = `${field.name}_${language.code.replace('-', '_')}`;
            if (normalizedFormData[translatedFieldName] === null || normalizedFormData[translatedFieldName] === undefined) {
              normalizedFormData[translatedFieldName] = '';
            }
          });
        }
      });
    }

    console.log(normalizedFormData, 'normalizedFormData')
    
    // Валидация
    errors = validateFormData(normalizedFormData, fields, translation || undefined);
    if (Object.keys(errors).length > 0) {
      return;
    }

    // Очищаем readonly поля перед отправкой
    const dataToSubmit = { ...normalizedFormData };
    delete dataToSubmit.url; // URL формируется на бекенде
    delete dataToSubmit.created_at;
    delete dataToSubmit.updated_at;
    
    // Убеждаемся, что обязательные поля заполнены
    // if (!dataToSubmit.title || dataToSubmit.title.trim() === '') {
    //   errors = { ...errors, title: 'Название страницы обязательно' };
    //   return;
    // }
    
    if (!dataToSubmit.slug || dataToSubmit.slug.trim() === '') {
      errors = { ...errors, slug: 'URL страницы обязателен' };
      return;
    }
    
    // Валидация slug
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(dataToSubmit.slug)) {
      errors = { ...errors, slug: 'URL может содержать только строчные буквы, цифры и дефисы' };
      return;
    }
    
    // Переводимые поля не являются обязательными по всем языкам
    // Требуем только базовые обязательные поля (например, title/slug),
    // а переводы считаем опциональными.
    
    // Убираем пустые строки из необязательных полей
    Object.keys(dataToSubmit).forEach(key => {
      if (typeof dataToSubmit[key] === 'string' && dataToSubmit[key].trim() === '') {
        // Проверяем, является ли поле обязательным
        const isRequiredField = ['title', 'slug', 'content'].includes(key);
        const isTranslatedField = translation?.languages?.some(lang => 
          key.endsWith(`_${lang.code.replace('-', '_')}`)
        );
        
        // Проверяем, является ли переводимое поле обязательным
        const isTranslatedRequiredField = isTranslatedField && fields.some(field => {
          // Убираем суффикс языка из имени поля
          // Поддерживаем форматы: _en, _en_US, _ru_RU и т.д.
          const baseFieldName = key.replace(/_[a-z]{2}(_[a-z]{2})?$/, '');
          return field.name === baseFieldName && field.required;
        });
        
        // Удаляем только необязательные поля, которые не являются переводами обязательных полей
        if (!isRequiredField && !isTranslatedRequiredField) {
          delete dataToSubmit[key];
        }
      }
    });

    isSubmitting = true;
    try {
      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Обработка ошибок валидации
      if (error instanceof Error && error.message.includes('Ошибки валидации:')) {
        // Проверяем, есть ли оригинальные ошибки валидации
        const originalErrors = (error as any).validationErrors;
        
        if (originalErrors && typeof originalErrors === 'object') {
          // Используем оригинальные ошибки
          errors = { ...errors, ...originalErrors };
        } else {
          // Парсим ошибки валидации из сообщения
          const errorMessage = error.message.replace('Ошибки валидации: ', '');
          const validationErrors: Record<string, string> = {};
          
          // Разбираем ошибки по полям
          errorMessage.split('; ').forEach(errorPart => {
            const [field, message] = errorPart.split(': ');
            if (field && message) {
              validationErrors[field] = message;
            }
          });
          
          // Обновляем локальные ошибки
          errors = { ...errors, ...validationErrors };
        }
      }
    } finally {
      isSubmitting = false;
    }
  }

  // Обработка сохранения как черновик
  async function handleSaveAsDraft() {
    const dataToSubmit = getDataToSubmit();
    
    // Валидация не обязательна для черновика
    isSubmitting = true;
    try {
      await onSaveAsDraft(dataToSubmit);
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      isSubmitting = false;
    }
  }

  // Обработка отмены
  function handleCancel() {
    onCancel();
  }

  // Переключение таба языка
  function switchLanguageTab(languageCode: string) {
    activeLanguageTab = languageCode;
  }

  // Получение полей без переводов
  function getNonTranslatedFields() {
    const nonTranslatedFields = fields.filter(field => 
      !field.is_translated && 
      field.name !== 'created_at' && 
      field.name !== 'updated_at'
    );
    
    // Добавляем поле URL как readonly поле
    const urlField: BasePageField = {
      name: 'url',
      type: 'CharField',
      required: false,
      help_text: 'Полный URL страницы',
      verbose_name: 'Полный URL страницы',
      max_length: 255
    };
    
    return [...nonTranslatedFields, urlField];
  }

  // Получение переводимых полей для конкретного языка
  function getTranslatedFieldsForLanguage(languageCode: string) {
    if (!translation?.has_translations) {
      return [];
    }

    return fields.filter(field => field.is_translated).map(field => ({
      ...field,
      name: `${field.name}_${languageCode.replace('-', '_')}`,
      verbose_name: `${field.verbose_name || field.name} (${languageCode.toUpperCase()})`,
      help_text: `${field.help_text || ''} (${languageCode.toUpperCase()})`.trim(),
      // Добавляем уникальный ключ для каждого языка
      uniqueKey: `${field.name}_${languageCode}_translated`
    }));
  }

  // Получение значения поля для языка
  function getFieldValue(field: BasePageField, languageCode: string) {
    if (!field.is_translated) {
      // Для поля URL используем реактивную переменную
      if (field.name === 'url') {
        return fullUrl;
      }
      return formData?.[field.name];
    }
    
    // Для переводимых полей имя уже содержит суффикс языка
    // так как поле было создано в getTranslatedFieldsForLanguage
    return formData?.[field.name];
  }

  // Получение данных для отправки на бекенд (для отладки)
  function getDataToSubmit() {
    // Нормализуем данные
    const normalizedFormData = { ...formData };
    if (translation?.languages) {
      fields.forEach(field => {
        if (field.is_translated && (field.type === 'CharField' || field.type === 'SlugField' || field.type === 'TextField')) {
          translation.languages.forEach(language => {
            const translatedFieldName = `${field.name}_${language.code.replace('-', '_')}`;
            if (normalizedFormData[translatedFieldName] === null || normalizedFormData[translatedFieldName] === undefined) {
              normalizedFormData[translatedFieldName] = '';
            }
          });
        }
      });
    }
    
    // Очищаем readonly поля
    const dataToSubmit = { ...normalizedFormData };
    delete dataToSubmit.url;
    delete dataToSubmit.created_at;
    delete dataToSubmit.updated_at;
    
    // Убираем пустые строки из необязательных полей
    Object.keys(dataToSubmit).forEach(key => {
      if (typeof dataToSubmit[key] === 'string' && dataToSubmit[key].trim() === '') {
        const isRequiredField = ['title', 'slug', 'content'].includes(key);
        const isTranslatedField = translation?.languages?.some(lang => 
          key.endsWith(`_${lang.code.replace('-', '_')}`)
        );
        
        const isTranslatedRequiredField = isTranslatedField && fields.some(field => {
          const baseFieldName = key.replace(/_[a-z]{2}(_[a-z]{2})?$/, '');
          return field.name === baseFieldName && field.required;
        });
        
        if (!isRequiredField && !isTranslatedRequiredField) {
          delete dataToSubmit[key];
        }
      }
    });
    
    return dataToSubmit;
  }

  // Получение название языка
  function getLanguageName(code: string) {
    return translation?.languages.find(lang => lang.code === code)?.name || code.toUpperCase();
  }
</script>

<form on:submit={handleSubmit} class="translated-dynamic-form">
  <div class="form-header">
    <h2>Редактор страницы</h2>
    <p>Заполните поля для создания или редактирования страницы</p>
  </div>

  <!-- Поля без переводов (всегда видны) -->
  {#if getNonTranslatedFields().length > 0}
    <div class="non-translated-section">
      <div class="section-header">
        <h3>📝 Общие поля</h3>
        <p>Эти поля не переводятся и применяются ко всем языкам</p>
      </div>
      
      <div class="form-fields">
        {#each getNonTranslatedFields() as field (field.name)}
          <DynamicField
            {field}
            value={field.name === 'url' ? fullUrl : formData?.[field.name]}
            currentId={initialData?.id || null}
            error={errors[field.name]}
            disabled={loading || isSubmitting}
            on:change={handleFieldChange}
          />
        {/each}
      </div>
    </div>
  {/if}

  <!-- Переводимые поля с табами языков -->
  {#if translation?.has_translations && translation.languages.length > 1 && fields.some(field => field.is_translated)}
    <div class="translated-section">
      <div class="section-header">
        <h3>🌐 Переводимые поля</h3>
        <p>Эти поля можно переводить на разные языки</p>
      </div>

      <!-- Табы для языков -->
      <div class="language-tabs">
        {#each translation.languages as language (language.code)}
          <button
            type="button"
            class="language-tab"
            class:active={activeLanguageTab === language.code}
            on:click={() => switchLanguageTab(language.code)}
          >
            <span class="language-code">{language.code.toUpperCase()}</span>
            <span class="language-name">{language.name}</span>
          </button>
        {/each}
      </div>

      <!-- Содержимое табов -->
      <div class="tab-content">
        {#each translation.languages as language (language.code)}
          <div
            class="tab-panel"
            class:active={activeLanguageTab === language.code}
            role="tabpanel"
          >
            <div class="tab-header">
              <h4>Поля для языка: {language.name}</h4>
              <span class="language-indicator">{language.code.toUpperCase()}</span>
            </div>
            
            <div class="form-fields">
              {#each getTranslatedFieldsForLanguage(language.code) as field (field.uniqueKey || field.name)}
                <DynamicField
                  {field}
                  value={getFieldValue(field, language.code)}
                  error={errors[field.name]}
                  disabled={loading || isSubmitting}
                  on:change={handleFieldChange}
                />
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else if translation?.has_translations && translation.languages.length > 1 && !fields.some(field => field.is_translated)}
    <!-- Если есть переводы, но нет переводимых полей -->
    <div class="no-translated-fields">
      <p>🌐 Переводы настроены, но нет переводимых полей для отображения</p>
    </div>
  {/if}

  <div class="form-actions">
    <button
      type="button"
      on:click={handleCancel}
      class="btn btn-secondary"
      disabled={loading || isSubmitting}
    >
      Отмена
    </button>
    
    <button
      type="button"
      on:click={() => handleSaveAsDraft()}
      class="btn btn-outline"
      disabled={loading || isSubmitting}
    >
      {#if isSubmitting}
        Сохранение...
      {:else}
        Сохранить как черновик
      {/if}
    </button>
    
    <button
      type="submit"
      class="btn btn-primary"
      disabled={loading || isSubmitting}
    >
      {#if isSubmitting}
        Сохранение...
      {:else}
        Сохранить
      {/if}
    </button>
  </div>
</form>

<style>
  .translated-dynamic-form {
    margin: 0 auto;
    padding: 2rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  }

  .form-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .form-header h2 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .form-header p {
    color: #6b7280;
    font-size: 1rem;
  }

  /* Стили для секций */
  .non-translated-section,
  .translated-section {
    margin-bottom: 2rem;
  }

  .section-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .section-header h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .section-header p {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
  }

  .non-translated-section .section-header {
    border-bottom-color: #10b981;
  }

  .translated-section .section-header {
    border-bottom-color: #3b82f6;
  }

  .no-translated-fields {
    text-align: center;
    padding: 2rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .no-translated-fields p {
    color: #6b7280;
    margin: 0;
    font-size: 0.875rem;
  }

  /* Стили для табов языков */
  .language-tabs {
    display: flex;
    border-bottom: 2px solid #e5e7eb;
    margin-bottom: 2rem;
    gap: 0;
  }

  .language-tab {
    background: none;
    border: none;
    padding: 1rem 1.5rem;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all 0.2s ease-in-out;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    color: #6b7280;
    font-weight: 500;
    min-width: 100px;
  }

  .language-tab:hover {
    color: #374151;
    background-color: #f9fafb;
  }

  .language-tab.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
    background-color: #f0f9ff;
  }

  .language-code {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .language-name {
    font-size: 0.875rem;
  }

  /* Стили для содержимого табов */
  .tab-content {
    position: relative;
    min-height: 400px;
  }

  .tab-panel {
    display: none;
    animation: fadeIn 0.2s ease-in-out;
  }

  .tab-panel.active {
    display: block;
  }

  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .tab-header h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .language-indicator {
    background: #3b82f6;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .form-fields {
    margin-bottom: 2rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  /* Стили для отладочной секции */
  .debug-section {
    margin: 2rem 0;
    padding: 1rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
  }

  .debug-toggle {
    cursor: pointer;
    font-weight: 600;
    color: #475569;
    padding: 0.5rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .debug-toggle:hover {
    background-color: #e2e8f0;
  }

  .debug-content {
    margin-top: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 0.25rem;
    border: 1px solid #e2e8f0;
  }

  .debug-content h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .debug-data {
    background: #1f2937;
    color: #f9fafb;
    padding: 1rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.75rem;
    line-height: 1.4;
    overflow-x: auto;
    margin: 0 0 1rem 0;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .debug-data:last-child {
    margin-bottom: 0;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    border: none;
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

  /* Анимация появления табов */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Адаптивность */
  @media (max-width: 768px) {
    .language-tabs {
      flex-wrap: wrap;
    }
    
    .language-tab {
      min-width: 80px;
      padding: 0.75rem 1rem;
    }
    
    .translated-dynamic-form {
      padding: 1rem;
    }
  }
</style>
