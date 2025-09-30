import { FC } from 'react'
import style from './index.module.scss'

interface ServiceItem {
  id: number
  icon: string
  title: string
  description: string
}

interface AvitoServicesProps {
  props?: {
    title?: string
    services?: ServiceItem[]
  }
}

const AvitoServices: FC<AvitoServicesProps> = ({ props }) => {
  const defaultServices: ServiceItem[] = [
    {
      id: 1,
      icon: '🚗',
      title: 'Автосервис',
      description: 'Ремонт и обслуживание автомобилей'
    },
    {
      id: 2,
      icon: '🏠',
      title: 'Недвижимость',
      description: 'Покупка, продажа, аренда жилья'
    },
    {
      id: 3,
      icon: '💼',
      title: 'Работа',
      description: 'Поиск работы и сотрудников'
    },
    {
      id: 4,
      icon: '🛍️',
      title: 'Объявления',
      description: 'Покупка и продажа товаров'
    },
    {
      id: 5,
      icon: '🎓',
      title: 'Услуги',
      description: 'Бытовые и профессиональные услуги'
    },
    {
      id: 6,
      icon: '📱',
      title: 'Электроника',
      description: 'Телефоны, компьютеры, техника'
    }
  ]

  const { title = 'Сервисы и услуги Авито', services = defaultServices } = props || {}

  return (
    <section className={style.widget}>
      <header className={style.header}>
        <h2 className={style.title}>
          {title}
        </h2>
      </header>
      <div className={style.container}>
        <ul className={style.servicesList}>
          {services.map((service) => (
            <li key={service.id} className={style.serviceItem}>
              <div className={style.serviceIcon}>
                {service.icon}
              </div>
              <div className={style.serviceContent}>
                <h3 className={style.serviceTitle}>
                  {service.title}
                </h3>
                <p className={style.serviceDescription}>
                  {service.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default AvitoServices
