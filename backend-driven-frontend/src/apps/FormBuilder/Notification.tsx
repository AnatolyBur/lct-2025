import React from 'react'
import styles from './Notification.module.scss'

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose: () => void
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <div className={styles.notificationContent}>
        <span className={styles.notificationIcon}>{getIcon()}</span>
        <span className={styles.notificationMessage}>{message}</span>
        <button
          className={styles.notificationClose}
          onClick={onClose}
          aria-label="Закрыть уведомление"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default Notification
