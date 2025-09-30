import { FC, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { RootStore } from '@/store'
import { ContextApiTypes } from '@/api/types/dirs'
import * as Pages from '.'

const CombinePage: FC = () => {
  const [value] = useSearchParams()
  const slug = useParams()
  const [pageContext, setPageContext] = useState<ContextApiTypes.IContextDto | {}>({})

  const pageMap = {
    // HomePage: <Pages.HomePage pageContext={pageContext} searchParams={value} />,
    // ImHelpingPage: <Pages.ImHelpingPage pageContext={pageContext} searchParams={value} />,
    Preview: <Pages.PreviewPage searchParams={value} />
  }

  if (!slug['*']) {
    return
  }

  useEffect(() => {
    if (slug['*']) {
      RootStore.contextStore.getContext({ slug: slug['*'] })
        .then((data) => {
          setPageContext(data)
          console.log('data', data)
        })
    }
  }, [])

  // console.log('pageContent', pageContext)

  return (
    pageContext?.page_model ? 
      pageMap[pageContext.page_model]
      :
      null
  )
}

export default CombinePage
