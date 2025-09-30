import { makeAutoObservable, runInAction } from 'mobx'
import RootStore from '../RootStore'
import { 
  FormBuilderConfig, 
  FormBuilderField, 
  FormEvent, 
  FormSubmission, 
  FormEventLog,
  DragItem,
  FormBuilderState,
  FormBuilderActions
} from '@/types/formBuilder'

class FormBuilderStore implements FormBuilderState, FormBuilderActions {
  // Состояние
  currentForm: FormBuilderConfig | null = null
  loading: boolean = false
  error: string | null = null

  // Уведомления
  notification: {
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    show: boolean
  } | null = null

  // Флаги для предотвращения повторных загрузок
  private currentFormLoading = false

  constructor(private rootStore: RootStore) {
    makeAutoObservable(this)
  }


  async loadForm(id: number): Promise<FormBuilderConfig | undefined> {
    if (this.currentFormLoading) return

    try {
      this.currentFormLoading = true
      this.setLoading(true)
      this.clearError()
      
      const response = await this.rootStore.api.formApi.getFormConfig(id)
      runInAction(() => {
        this.currentForm = response.data
      })
      
      
      return response.data
    } catch (err) {
      this.setError(err instanceof Error ? err.message : 'Ошибка загрузки формы')
      throw err
    } finally {
      this.currentFormLoading = false
      this.setLoading(false)
    }
  }





  clearError(): void {
    this.error = null
  }

  // Уведомления
  showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notification = { type, message, show: true }
  }

  hideNotification(): void {
    this.notification = null
  }


  // Вспомогательные методы
  private setLoading(loading: boolean): void {
    this.loading = loading
  }

  private setError(error: string): void {
    this.error = error
  }

  // Геттеры для удобства

  get hasCurrentForm(): boolean {
    return this.currentForm !== null
  }

}

export default FormBuilderStore
