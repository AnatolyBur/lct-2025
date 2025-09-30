import RootStore from '../RootStore'
import * as UserStoreTypes from './userStore'
import * as ContextStoreTypes from './contextStore'

interface IStoreModule {
  rs: typeof RootStore
}

export type {
  IStoreModule,
  UserStoreTypes,
  ContextStoreTypes
}
