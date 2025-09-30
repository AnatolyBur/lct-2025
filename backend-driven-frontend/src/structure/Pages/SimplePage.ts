import { FC, useState, useEffect } from 'react'
import { PageBuilder } from '@/services'

//@ts-ignore
const SimplePage: FC = () => {
  const [layout, setLayout] = useState<Element | null>(null)
  const PageBuilderInstance = new PageBuilder('')

  useEffect(() => {
    PageBuilderInstance.getUILayout()
      .then((data) => {
        //@ts-ignore
        setLayout(data)
      })
  }, [])

  return layout
}

export default SimplePage