import { useContext } from 'react'
import { RootStore, StoreContext } from '@/store'

const useStores = (): typeof RootStore => useContext(StoreContext)

export default useStores
