import { FC } from 'react'
import { IContent } from '@/services/types/pageBuilder'

export interface ILayout {
  content?: IContent | null
}

const Layout: FC<ILayout> = ({ content }) => {
  if (!content) {
    return null
  }

  console.log('content', content)

  return (
    <> 
      { content.rows.length && content.rows.map(row => (
        <div>
          { row.columns.map(column => (
            <div>
              { column.widgets.map(widget => (
                <div>test</div>
                // getWidgetById(widget.id, widget.props)
              ))}
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

export default Layout
