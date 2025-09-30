import { ReactElement } from 'react'
import { RouterProvider } from 'react-router-dom'
import { MainRouter } from '@/router'
import { StoreContext, RootStore } from '@/store'

function App (): ReactElement {
  return (
    <StoreContext.Provider value={RootStore}>
      <div className='App'>
        <RouterProvider router={MainRouter} />
      </div>
    </StoreContext.Provider>
  )
}

export default App
