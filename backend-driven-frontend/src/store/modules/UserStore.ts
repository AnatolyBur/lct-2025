import { makeAutoObservable } from 'mobx'
import { RootStore } from '../'
import { IUserStore } from '../types/userStore'

class UserStore implements IUserStore {
  rs: typeof RootStore

  constructor (ctx: typeof RootStore) {
    this.rs = ctx

    makeAutoObservable(this)
  }
}

export default UserStore
