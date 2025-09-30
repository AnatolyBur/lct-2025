import { BaseApi } from '../abstract'
import ContextApi from './ContextApi'
import FormApi from './FormApi'

class Api extends BaseApi {
  contextApi: ContextApi
  formApi: FormApi

  constructor(url: string) {
    super(url)
    this.contextApi = new ContextApi(this)
    this.formApi = new FormApi(this)
  }
}

export {
  Api
}
