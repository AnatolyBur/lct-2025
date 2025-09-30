import React, { useState } from 'react'
import { FormBuilderConfig } from '@/types/formBuilder'
import styles from './FormPreview.module.scss'

interface FormPreviewProps {
  form: FormBuilderConfig
  onSubmit?: (data: any) => void
  isSubmitting?: boolean
}

const FormPreview: React.FC<FormPreviewProps> = ({ form, onSubmit, isSubmitting: externalIsSubmitting }) => {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const submitting = externalIsSubmitting !== undefined ? externalIsSubmitting : isSubmitting

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    
    // Очистка ошибки для этого поля
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    form.form_config.fields.forEach(field => {
      const value = formData[field.name]
      
      if (field.required && (!value || value === '')) {
        newErrors[field.name] = 'Это поле обязательно для заполнения'
        return
      }
      
      if (value) {
        // Валидация email
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field.name] = 'Введите корректный email адрес'
          return
        }
        
        // Валидация URL
        if (field.type === 'url' && !/^https?:\/\/.+/.test(value)) {
          newErrors[field.name] = 'Введите корректный URL'
          return
        }
        
        // Валидация минимальной длины
        if (field.min_length && value.length < field.min_length) {
          newErrors[field.name] = `Минимальная длина: ${field.min_length} символов`
          return
        }
        
        // Валидация максимальной длины
        if (field.max_length && value.length > field.max_length) {
          newErrors[field.name] = `Максимальная длина: ${field.max_length} символов`
          return
        }
        
        // Валидация числа
        if (field.type === 'number') {
          const numValue = parseFloat(value)
          if (isNaN(numValue)) {
            newErrors[field.name] = 'Введите корректное число'
            return
          }
          
          if (field.min !== undefined && numValue < field.min) {
            newErrors[field.name] = `Минимальное значение: ${field.min}`
            return
          }
          
          if (field.max !== undefined && numValue > field.max) {
            newErrors[field.name] = `Максимальное значение: ${field.max}`
            return
          }
        }
        
        // Валидация по регулярному выражению
        if (field.pattern && !new RegExp(field.pattern).test(value)) {
          newErrors[field.name] = 'Значение не соответствует требуемому формату'
          return
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    if (onSubmit) {
      // Используем внешний обработчик
      await onSubmit(formData)
    } else {
      // Внутренняя логика отправки
      setIsSubmitting(true)
      
      try {
        // Здесь будет отправка данных на сервер
        console.log('Отправка формы:', formData)
        
        // Имитация отправки
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        alert(form.success_message)
        setFormData({})
      } catch (error) {
        console.error('Ошибка отправки формы:', error)
        alert('Произошла ошибка при отправке формы')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const renderField = (field: any) => {
    const value = formData[field.name] || field.default_value || ''
    const error = errors[field.name]
    
    return (
      <div key={field.id} className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          {field.label}
          {field.required && <span className={styles.required}>*</span>}
        </label>
        
        {renderFieldInput(field, value, error)}
        
        {field.help_text && (
          <div className={styles.fieldHelp}>{field.help_text}</div>
        )}
        
        {error && (
          <div className={styles.fieldError}>{error}</div>
        )}
      </div>
    )
  }

  const renderFieldInput = (field: any, value: any, error: string) => {
    const inputProps = {
      id: field.name,
      name: field.name,
      value: value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        handleInputChange(field.name, e.target.value)
      },
      className: `${styles.fieldInput} ${error ? styles.error : ''}`,
      placeholder: field.placeholder,
      required: field.required
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
        return (
          <input
            {...inputProps}
            type={field.type}
            minLength={field.min_length}
            maxLength={field.max_length}
            pattern={field.pattern}
          />
        )
      
      case 'textarea':
        return (
          <textarea
            {...inputProps}
            rows={4}
            minLength={field.min_length}
            maxLength={field.max_length}
          />
        )
      
      case 'select':
        return (
          <select {...inputProps}>
            <option value="">{field.placeholder || 'Выберите опцию'}</option>
            {field.options?.map((option: any, index: number) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'checkbox':
        return (
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={!!value}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className={styles.checkbox}
            />
            <label htmlFor={field.name} className={styles.checkboxLabel}>
              {field.label}
            </label>
          </div>
        )
      
      case 'radio':
        return (
          <div className={styles.radioGroup}>
            {field.options?.map((option: any, index: number) => (
              <div key={index} className={styles.radioOption}>
                <input
                  type="radio"
                  id={`${field.name}_${index}`}
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={styles.radio}
                />
                <label htmlFor={`${field.name}_${index}`} className={styles.radioLabel}>
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )
      
      case 'file':
        return (
          <input
            {...inputProps}
            type="file"
            accept={field.accept}
            multiple={field.multiple}
            onChange={(e) => {
              const files = e.target.files
              handleInputChange(field.name, files ? Array.from(files) : [])
            }}
          />
        )
      
      case 'date':
        return (
          <input
            {...inputProps}
            type="date"
          />
        )
      
      case 'number':
        return (
          <input
            {...inputProps}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
          />
        )
      
      default:
        return (
          <input
            {...inputProps}
            type="text"
          />
        )
    }
  }

  return (
    <div className={styles.formPreview}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>{form.form_title}</h2>
        {form.form_description && (
          <p className={styles.formDescription}>{form.form_description}</p>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {form.form_config.fields.map(renderField)}
        
        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? 'Отправка...' : form.submit_text}
          </button>
        </div>
      </form>
    </div>
  )
}

export default FormPreview