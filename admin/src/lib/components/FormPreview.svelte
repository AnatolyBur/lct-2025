<!-- Компонент предварительного просмотра формы -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { FormBuilderConfig, FormBuilderField } from '$lib/types/formBuilder';

  const dispatch = createEventDispatcher();

  export let form: FormBuilderConfig;
  export let submittedData: Record<string, any> = {};
  export let errors: Record<string, string> = {};
  export let isSubmitting: boolean = false;

  // Локальное состояние для данных формы
  let formData: Record<string, any> = { ...submittedData };

  // Инициализация данных формы
  $: {
    if (form?.form_config?.fields) {
      const initialData: Record<string, any> = {};
      form.form_config.fields.forEach(field => {
        if (field.default_value !== undefined) {
          initialData[field.name] = field.default_value;
        } else {
          switch (field.type) {
            case 'text':
            case 'email':
            case 'textarea':
            case 'tel':
            case 'url':
              initialData[field.name] = '';
              break;
            case 'number':
              initialData[field.name] = null;
              break;
            case 'checkbox':
              initialData[field.name] = false;
              break;
            case 'select':
            case 'radio':
              initialData[field.name] = '';
              break;
            case 'file':
              initialData[field.name] = null;
              break;
            case 'date':
              initialData[field.name] = '';
              break;
            default:
              initialData[field.name] = '';
          }
        }
      });
      formData = { ...initialData, ...submittedData };
    }
  }

  // Обработка изменения поля
  function handleFieldChange(fieldName: string, value: any) {
    formData[fieldName] = value;
    dispatch('change', { fieldName, value, formData });
  }

  // Обработка отправки формы
  function handleSubmit(event: Event) {
    event.preventDefault();
    dispatch('submit', { formData });
  }

  // Получение значения поля
  function getFieldValue(fieldName: string): any {
    return formData[fieldName];
  }

  // Проверка, есть ли ошибка для поля
  function hasFieldError(fieldName: string): boolean {
    return !!errors[fieldName];
  }

  // Получение сообщения об ошибке
  function getFieldError(fieldName: string): string {
    return errors[fieldName] || '';
  }

  // Рендеринг поля в зависимости от типа
  function renderField(field: FormBuilderField) {
    const value = getFieldValue(field.name);
    const hasError = hasFieldError(field.name);
    const errorMessage = getFieldError(field.name);

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
        return `
          <input
            type="${field.type}"
            name="${field.name}"
            value="${value || ''}"
            placeholder="${field.placeholder || ''}"
            ${field.required ? 'required' : ''}
            ${field.max_length ? `maxlength="${field.max_length}"` : ''}
            class="form-field ${hasError ? 'error' : ''}"
          />
        `;
      
      case 'number':
        return `
          <input
            type="number"
            name="${field.name}"
            value="${value || ''}"
            placeholder="${field.placeholder || ''}"
            ${field.required ? 'required' : ''}
            ${field.min !== undefined ? `min="${field.min}"` : ''}
            ${field.max !== undefined ? `max="${field.max}"` : ''}
            ${field.step !== undefined ? `step="${field.step}"` : ''}
            class="form-field ${hasError ? 'error' : ''}"
          />
        `;
      
      case 'textarea':
        return `
          <textarea
            name="${field.name}"
            placeholder="${field.placeholder || ''}"
            ${field.required ? 'required' : ''}
            ${field.max_length ? `maxlength="${field.max_length}"` : ''}
            class="form-field ${hasError ? 'error' : ''}"
            rows="4"
          >${value || ''}</textarea>
        `;
      
      case 'select':
        return `
          <select
            name="${field.name}"
            ${field.required ? 'required' : ''}
            class="form-field ${hasError ? 'error' : ''}"
          >
            <option value="">-- Выберите --</option>
            ${field.options?.map(option => `
              <option value="${option.value}" ${value === option.value ? 'selected' : ''}>
                ${option.label}
              </option>
            `).join('') || ''}
          </select>
        `;
      
      case 'radio':
        return `
          <div class="radio-group">
            ${field.options?.map(option => `
              <label class="radio-label">
                <input
                  type="radio"
                  name="${field.name}"
                  value="${option.value}"
                  ${value === option.value ? 'checked' : ''}
                  ${field.required ? 'required' : ''}
                  class="form-field"
                />
                <span class="radio-text">${option.label}</span>
              </label>
            `).join('') || ''}
          </div>
        `;
      
      case 'checkbox':
        return `
          <label class="checkbox-label">
            <input
              type="checkbox"
              name="${field.name}"
              ${value ? 'checked' : ''}
              class="form-field"
            />
            <span class="checkbox-text">${field.label}</span>
          </label>
        `;
      
      case 'file':
        return `
          <input
            type="file"
            name="${field.name}"
            ${field.required ? 'required' : ''}
            ${field.accept ? `accept="${field.accept}"` : ''}
            ${field.multiple ? 'multiple' : ''}
            class="form-field ${hasError ? 'error' : ''}"
          />
        `;
      
      case 'date':
        return `
          <input
            type="date"
            name="${field.name}"
            value="${value || ''}"
            ${field.required ? 'required' : ''}
            class="form-field ${hasError ? 'error' : ''}"
          />
        `;
      
      default:
        return `
          <input
            type="text"
            name="${field.name}"
            value="${value || ''}"
            placeholder="${field.placeholder || ''}"
            ${field.required ? 'required' : ''}
            class="form-field ${hasError ? 'error' : ''}"
          />
        `;
    }
  }
</script>

<div class="form-preview">
  <div class="preview-header">
    <h2>{form.form_title}</h2>
    {#if form.form_description}
      <p class="form-description">{form.form_description}</p>
    {/if}
  </div>

  <form on:submit={handleSubmit} class="preview-form">
    <div class="form-fields">
      {#each form.form_config.fields as field (field.id)}
        <div class="field-container">
          <label for={field.name} class="field-label">
            {field.label}
            {#if field.required}
              <span class="required">*</span>
            {/if}
          </label>
          
          {#if field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'url'}
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={getFieldValue(field.name) || ''}
              placeholder={field.placeholder || ''}
              required={field.required}
              maxlength={field.max_length}
              on:input={(e) => handleFieldChange(field.name, e.target.value)}
              class="form-field {hasFieldError(field.name) ? 'error' : ''}"
            />
          {:else if field.type === 'number'}
            <input
              type="number"
              id={field.name}
              name={field.name}
              value={getFieldValue(field.name) || ''}
              placeholder={field.placeholder || ''}
              required={field.required}
              min={field.min}
              max={field.max}
              step={field.step}
              on:input={(e) => handleFieldChange(field.name, e.target.value)}
              class="form-field {hasFieldError(field.name) ? 'error' : ''}"
            />
          {:else if field.type === 'textarea'}
            <textarea
              id={field.name}
              name={field.name}
              placeholder={field.placeholder || ''}
              required={field.required}
              maxlength={field.max_length}
              on:input={(e) => handleFieldChange(field.name, e.target.value)}
              class="form-field {hasFieldError(field.name) ? 'error' : ''}"
              rows="4"
            >{getFieldValue(field.name) || ''}</textarea>
          {:else if field.type === 'select'}
            <select
              id={field.name}
              name={field.name}
              required={field.required}
              on:change={(e) => handleFieldChange(field.name, e.target.value)}
              class="form-field {hasFieldError(field.name) ? 'error' : ''}"
            >
              <option value="">-- Выберите --</option>
              {#each field.options || [] as option}
                <option value={option.value} selected={getFieldValue(field.name) === option.value}>
                  {option.label}
                </option>
              {/each}
            </select>
          {:else if field.type === 'radio'}
            <div class="radio-group">
              {#each field.options || [] as option}
                <label class="radio-label">
                  <input
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={getFieldValue(field.name) === option.value}
                    required={field.required}
                    on:change={(e) => handleFieldChange(field.name, e.target.value)}
                    class="form-field"
                  />
                  <span class="radio-text">{option.label}</span>
                </label>
              {/each}
            </div>
          {:else if field.type === 'checkbox'}
            <label class="checkbox-label">
              <input
                type="checkbox"
                name={field.name}
                checked={getFieldValue(field.name) || false}
                on:change={(e) => handleFieldChange(field.name, e.target.checked)}
                class="form-field"
              />
              <span class="checkbox-text">{field.label}</span>
            </label>
          {:else if field.type === 'file'}
            <input
              type="file"
              id={field.name}
              name={field.name}
              required={field.required}
              accept={field.accept}
              multiple={field.multiple}
              on:change={(e) => handleFieldChange(field.name, e.target.files?.[0] || null)}
              class="form-field {hasFieldError(field.name) ? 'error' : ''}"
            />
          {:else if field.type === 'date'}
            <input
              type="date"
              id={field.name}
              name={field.name}
              value={getFieldValue(field.name) || ''}
              required={field.required}
              on:change={(e) => handleFieldChange(field.name, e.target.value)}
              class="form-field {hasFieldError(field.name) ? 'error' : ''}"
            />
          {/if}
          
          {#if field.help_text}
            <p class="field-help">{field.help_text}</p>
          {/if}
          
          {#if hasFieldError(field.name)}
            <p class="field-error">{getFieldError(field.name)}</p>
          {/if}
        </div>
      {/each}
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          Отправка...
        {:else}
          {form.submit_text}
        {/if}
      </button>
    </div>
  </form>
</div>

<style>
  .form-preview {
    padding: 2rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .preview-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .preview-header h2 {
    margin: 0 0 1rem 0;
    font-size: 1.875rem;
    font-weight: 600;
    color: #1a202c;
  }

  .form-description {
    margin: 0;
    font-size: 1rem;
    color: #6b7280;
    line-height: 1.5;
  }

  .preview-form {
    max-width: 600px;
    margin: 0 auto;
  }

  .form-fields {
    margin-bottom: 2rem;
  }

  .field-container {
    margin-bottom: 1.5rem;
  }

  .field-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #374151;
    font-size: 0.875rem;
  }

  .required {
    color: #ef4444;
    margin-left: 0.25rem;
  }

  .form-field {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    background: white;
  }

  .form-field:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-field.error {
    border-color: #ef4444;
  }

  .form-field.error:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .field-help {
    margin: 0.5rem 0 0 0;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .field-error {
    margin: 0.5rem 0 0 0;
    font-size: 0.875rem;
    color: #ef4444;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #374151;
  }

  .radio-label input[type="radio"] {
    width: auto;
    margin: 0;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #374151;
  }

  .checkbox-label input[type="checkbox"] {
    width: auto;
    margin: 0;
  }

  .form-actions {
    display: flex;
    justify-content: center;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  /* Адаптивность */
  @media (max-width: 768px) {
    .form-preview {
      padding: 1rem;
    }
    
    .preview-header h2 {
      font-size: 1.5rem;
    }
    
    .radio-group {
      gap: 0.75rem;
    }
    
    .radio-label,
    .checkbox-label {
      font-size: 1rem;
    }
  }
</style>
