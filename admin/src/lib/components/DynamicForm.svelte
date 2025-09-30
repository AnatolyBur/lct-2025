<!-- Компонент динамической формы на основе метаданных -->
<script lang="ts">
  import { onMount } from 'svelte';
  import DynamicField from './DynamicField.svelte';
  import type { BasePageField, PageData } from '$lib/types/page';
  import { createInitialFormData, validateFormData } from '$lib/utils/form';

  export let fields: BasePageField[] = [];
  export let initialData: PageData | null = null;
  export let onSubmit: (data: PageData) => void = () => {};
  export let onCancel: () => void = () => {};
  export let onDataChange: (data: PageData) => void = () => {};
  export let loading: boolean = false;
  export let id: string = '';

  let formData: PageData;
  let errors: Record<string, string> = {};
  let isSubmitting = false;

  // Инициализация данных формы
  onMount(() => {
    initializeFormData();
  });


  function initializeFormData() {
    if (initialData) {
      formData = { ...initialData };
    } else {
      formData = createInitialFormData(fields);
    }
  }

  // Обработка изменения поля
  function handleFieldChange(event: CustomEvent) {
    const { field, value } = event.detail;
    formData[field] = value;
    
    // Очистка ошибки для этого поля
    if (errors[field]) {
      errors = { ...errors };
      delete errors[field];
    }
    onDataChange(formData);
  }

  // Обработка отправки формы
  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    // Валидация
    errors = validateFormData(formData, fields);
    
    if (Object.keys(errors).length > 0) {
      return;
    }

    isSubmitting = true;
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Ошибка при отправке формы:', err);
      throw err;
    } finally {
      isSubmitting = false;
    }
  }

  // Обработка отмены
  function handleCancel() {
    onCancel();
  }
</script>

<form on:submit={handleSubmit} class="dynamic-form" {id}>
  <div class="form-fields">
    {#each fields as field (field.name)}
      <DynamicField
        {field}
        value={formData?.[field.name]}
        error={errors[field.name]}
        disabled={loading || isSubmitting}
        on:change={handleFieldChange}
      />
    {/each}
  </div>


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
  .dynamic-form {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
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



</style>
