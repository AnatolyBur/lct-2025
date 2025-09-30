<!-- Компонент для динамического поля формы -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import type { BasePageField } from '$lib/types/page';
  import { generateSlugFromTitle } from '$lib/utils/form';
  import { apiClient } from '$lib/api/client';

  const dispatch = createEventDispatcher();

  export let field: BasePageField;
  export let value: any;
  export let error: string | null = null;
  export let disabled: boolean = false;
  export let currentId: number | null = null;

  let parentSearch = '';
  let parentOptions: Array<{ id: number; title: string }>|null = null;
  let showParentOptions = false;
  let parentLoading = false;
  let parentTitleLoaded = false;

  async function fetchParentOptions(query: string) {
    if (!query || query.length < 2) {
      parentOptions = null;
      return;
    }
    parentLoading = true;
    try {
      const results = await apiClient.getPages({ q: query, exclude: currentId ?? undefined });
      parentOptions = results.map(p => ({ id: p.id as unknown as number, title: (p as any).title || String(p.id) }));
    } catch (e) {
      parentOptions = [];
    } finally {
      parentLoading = false;
    }
  }

  function selectParent(option: { id: number; title: string }) {
    dispatch('change', { field: field.name, value: option.id });
    parentSearch = option.title;
    showParentOptions = false;
  }

  async function loadParentTitleById(id: number) {
    try {
      const page = await apiClient.getPage(id);
      const title = (page as any).title || String(id);
      parentSearch = title;
      parentTitleLoaded = true;
    } catch (e) {
      parentTitleLoaded = true;
    }
  }

  // Автозаполнение названия родителя при редактировании
  $: (async () => {
    if (field?.name === 'parent' && !parentTitleLoaded) {
      const id = typeof value === 'number' ? value : (typeof value === 'string' ? parseInt(value as any) : null);
      if (id && !isNaN(id) && (!parentSearch || parentSearch.trim() === '')) {
        await loadParentTitleById(id);
      }
    }
  })();


  // Обработка изменения значения
  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    let newValue: any = target.value;

    // Преобразование типов
    switch (field.type) {
      case 'BooleanField':
        newValue = (target as HTMLInputElement).checked;
        break;
      case 'ForeignKey':
        newValue = newValue ? parseInt(newValue) : null;
        break;
      case 'ManyToManyField':
        // Для ManyToManyField нужна отдельная логика
        break;
      case 'FileField':
        // Для файловых полей получаем файл
        const fileInput = target as HTMLInputElement;
        newValue = fileInput.files?.[0] || null;
        break;
      default:
        if (newValue === '') {
          newValue = null;
        }
    }

    // Автогенерация slug из title
    if (field.name === 'slug' && value === '') {
      const titleField = document.querySelector('input[name="title"]') as HTMLInputElement;
      if (titleField) {
        newValue = generateSlugFromTitle(titleField.value);
      }
    }

    // Отправка события изменения
    dispatch('change', { field: field.name, value: newValue });
  }

  // Получение типа input для HTML
  function getInputType(): string {
    switch (field.type) {
      case 'BooleanField':
        return 'checkbox';
      case 'DateTimeField':
        // Для полей даты используем text, так как они readonly
        return 'text';
      default:
        return 'text';
    }
  }
</script>

<div class="field-container">
  <label for={field.name} class="field-label">
    {field.help_text}
    {#if field.required}
      <span class="required">*</span>
    {/if}
  </label>
  

  <!-- {#if field.help_text}
    <p class="field-help">{field.help_text}</p>
  {/if} -->

  {#if field.type === 'TextField'}
    <textarea
      id={field.name}
      name={field.name}
      value={value || ''}
      on:input={handleChange}
      {disabled}
      class="field-input textarea"
      rows="4"
    ></textarea>
  {:else if field.type === 'BooleanField'}
    <input
      type="checkbox"
      id={field.name}
      name={field.name}
      checked={value || false}
      on:change={handleChange}
      {disabled}
      class="field-input checkbox"
    />
  {:else if field.type === 'FileField'}
    <div class="file-field-container">
      <input
        type="file"
        id={field.name}
        name={field.name}
        on:change={handleChange}
        {disabled}
        class="field-input file-input"
        accept="image/*"
      />
      {#if value && typeof value === 'string'}
        <div class="current-file">
          <p>Текущий файл: {value}</p>
        </div>
      {:else if value && value instanceof File}
        <div class="current-file">
          <p>Выбранный файл: {value.name}</p>
        </div>
      {/if}
    </div>
  {:else if field.name === 'url'}
    <input
      type="text"
      id={field.name}
      name={field.name}
      value={value || ''}
      {disabled}
      class="field-input readonly"
      readonly
      placeholder="URL будет сформирован автоматически"
    />
  {:else if field.choices}
    <select
      id={field.name}
      name={field.name}
      value={value || ''}
      on:change={handleChange}
      {disabled}
      class="field-input select"
    >
      <option value="">-- Выберите --</option>
      {#each field.choices as choice}
        <option value={choice.value}>{choice.label}</option>
      {/each}
    </select>
  {:else if field.name === 'parent'}
    <div class="autocomplete">
      <input
        type="text"
        id={field.name}
        name={field.name}
        value={parentSearch}
        on:input={(e) => { parentSearch = (e.target as HTMLInputElement).value; fetchParentOptions(parentSearch); showParentOptions = true; }}
        {disabled}
        class="field-input"
        placeholder="Начните вводить название страницы"
      />
      {#if showParentOptions}
        <div class="options">
          {#if parentLoading}
            <div class="option disabled">Поиск...</div>
          {:else if parentOptions && parentOptions.length > 0}
            {#each parentOptions as option}
              <div class="option" role="button" tabindex="0" on:click={() => selectParent(option)} on:keydown={(e) => e.key === 'Enter' && selectParent(option)}>{option.title}</div>
            {/each}
          {:else if parentOptions}
            <div class="option disabled">Ничего не найдено</div>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <input
      type={getInputType()}
      id={field.name}
      name={field.name}
      value={value || ''}
      on:input={handleChange}
      {disabled}
      class="field-input"
      maxlength={field.max_length}
    />
  {/if}

  {#if error}
    <p class="field-error">{error}</p>
  {/if}
</div>

<style>
  .field-container {
    margin-bottom: 1rem;
  }

  .field-label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
  }

  .required {
    color: #ef4444;
    margin-left: 0.25rem;
  }


  .field-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }

  .field-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .field-input:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }

  .textarea {
    resize: vertical;
    min-height: 100px;
  }

  .checkbox {
    width: auto;
    margin-right: 0.5rem;
  }

  .select {
    cursor: pointer;
  }

  .file-field-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .file-input {
    cursor: pointer;
    padding: 0.5rem;
  }

  .file-input::-webkit-file-upload-button {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    margin-right: 0.5rem;
    font-size: 0.875rem;
  }

  .file-input::-webkit-file-upload-button:hover {
    background-color: #2563eb;
  }

  .current-file {
    padding: 0.5rem;
    background-color: #f3f4f6;
    border-radius: 0.25rem;
    border: 1px solid #d1d5db;
  }

  .current-file p {
    margin: 0;
    font-size: 0.875rem;
    color: #374151;
  }

  .readonly {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
    border-color: #e5e7eb;
    font-style: italic;
  }

  .readonly:focus {
    border-color: #e5e7eb;
    box-shadow: none;
  }

  .field-error {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .autocomplete {
    position: relative;
  }
  .options {
    position: absolute;
    z-index: 10;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    margin-top: 0.25rem;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  }
  .option {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
  }
  .option:hover {
    background: #f3f4f6;
  }
  .option.disabled {
    color: #9ca3af;
    cursor: default;
  }

</style>
