import { createBrowserRouter } from 'react-router-dom'
import { CombinePage } from '@/pages'

const MainRouter = createBrowserRouter([
  {
    path: '*',
    element: <CombinePage />
  }
])

export default MainRouter
