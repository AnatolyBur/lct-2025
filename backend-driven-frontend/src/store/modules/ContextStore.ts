import { makeAutoObservable } from 'mobx'
import { RootStore } from '../'
import { ContextStoreTypes } from '../types'
import { ContextApiTypes } from '@/api/types/dirs'

class ContextStore implements ContextStoreTypes.IContextStore {
  rs: typeof RootStore
  context?: ContextApiTypes.IContextDto

  constructor (ctx: typeof RootStore) {
    this.rs = ctx

    makeAutoObservable(this)
  }

  async getContext({ slug }: ContextApiTypes.IContextReq) {
    const res = await this.rs.api.contextApi.getContext({ slug })
    this.context = res.data

    return res.data
  }
}

export default ContextStore
