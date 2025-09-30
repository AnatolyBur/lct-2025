import React, { useEffect, useState } from 'react'
import useStore from '@/hooks/useStore'
import FormPreview from './FormPreview'
import Notification from './Notification'
import styles from './index.module.scss'

interface FormBuilderProps {
  formId: number
  onSubmit?: (data: any) => void
  onSuccess?: (response: any) => void
  onError?: (error: any) => void
}

const FormBuilder: React.FC<FormBuilderProps> = ({ 
  formId, 
  onSubmit,
  onSuccess,
  onError
}) => {
  const { formBuilderStore } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Загрузка данных при монтировании
  useEffect(() => {
    const loadData = async () => {
      if (!formId) {
        formBuilderStore.setError('Не указан ID формы')
        return
      }

      try {
        await formBuilderStore.loadForm(formId)
      } catch (error) {
        console.error('Ошибка загрузки формы:', error)
        onError?.(error)
      }
    }

    loadData()
  }, [formId, formBuilderStore, onError])

  // Обработка отправки формы
  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true)
    
    try {
      // Вызываем пользовательский обработчик
      if (onSubmit) {
        const result = await onSubmit(formData)
        onSuccess?.(result)
      } else {
        // Отправляем на сервер через API
        const response = await formBuilderStore.rootStore.api.formApi.submitForm(formId, formData)
        onSuccess?.(response.data)
      }
    } catch (error) {
      console.error('Ошибка отправки формы:', error)
      onError?.(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.formBuilder}>
      {/* Уведомления */}
      {formBuilderStore.notification && (
        <Notification 
          type={formBuilderStore.notification.type}
          message={formBuilderStore.notification.message}
          onClose={() => formBuilderStore.hideNotification()}
        />
      )}

      {/* Ошибки */}
      {formBuilderStore.error && (
        <Notification 
          type="error"
          message={formBuilderStore.error}
          onClose={() => formBuilderStore.clearError()}
        />
      )}

      {/* Основной контент */}
      {formBuilderStore.loading ? (
        <div className={styles.loading}>
          <p>Загрузка формы...</p>
        </div>
      ) : formBuilderStore.currentForm ? (
        <div className={styles.formContainer}>
          <FormPreview 
            form={formBuilderStore.currentForm} 
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      ) : (
        <div className={styles.errorState}>
          <p>Форма не найдена</p>
        </div>
      )}
    </div>
  )
}

export default FormBuilder
