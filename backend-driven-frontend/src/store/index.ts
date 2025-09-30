import { createContext } from 'react'
import RootStore from './RootStore'
import UserStore from './modules/UserStore'
import ContextStore from './modules/ContextStore'

const StoreContext = createContext<typeof RootStore>(RootStore)

export {
  StoreContext,
  RootStore,
  UserStore,
  ContextStore
}
