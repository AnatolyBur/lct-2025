import { Api } from '@/api/dirs'
import UserStore from './modules/UserStore'
import ContextStore from './modules/ContextStore'
import FormBuilderStore from './modules/FormBuilderStore'

class RootStore {
  api: Api
  userStore: UserStore
  contextStore: ContextStore
  formBuilderStore: FormBuilderStore

  constructor () {
    this.api = new Api(import.meta.env.VITE_BACKEND_API_URI || '')

    if (!import.meta.env.VITE_BACKEND_API_URI) {
      console.error(`Backend API URL isn't set in RootStore`)
    }

    this.userStore = new UserStore(this)
    this.contextStore = new ContextStore(this)
    this.formBuilderStore = new FormBuilderStore(this)
  }
}

export default new RootStore()
