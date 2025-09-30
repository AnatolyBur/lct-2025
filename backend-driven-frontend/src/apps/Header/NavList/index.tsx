import { FC } from 'react'
import style from './index.module.scss'

const NavList: FC = () => {
  return (
    <ul className={style.list}>
      <li className={style.item}>
        <a className={style.link} href='test.com'>Test</a>
      </li>
    </ul>
  )
}

export default NavList
