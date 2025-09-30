import { FC } from 'react'
import classNames from 'classnames'
import style from './index.module.scss'

const Footer: FC = () => {
  return (
    <footer className={classNames([style.widget, style.test])}>FOOTER</footer>
  )
}

export default Footer
