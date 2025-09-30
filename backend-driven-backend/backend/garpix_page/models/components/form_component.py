from django.db import models
from django.core.validators import RegexValidator
from .base_component import BaseComponent
import json

class FormComponent(BaseComponent):
    """
    Компонент формы с конструктором
    """
    form_title = models.CharField(max_length=255, verbose_name='Заголовок формы')
    form_description = models.TextField(blank=True, verbose_name='Описание формы')
    submit_text = models.CharField(max_length=100, default='Отправить', verbose_name='Текст кнопки отправки')
    success_message = models.TextField(default='Форма успешно отправлена!', verbose_name='Сообщение об успехе')
    
    # JSON конфигурация полей формы
    form_config = models.JSONField(
        default=dict,
        verbose_name='Конфигурация полей формы',
        help_text='JSON конфигурация полей, созданных в конструкторе'
    )
    
    # Настройки отправки
    email_notifications = models.BooleanField(default=False, verbose_name='Email уведомления')
    notification_emails = models.TextField(
        blank=True, 
        verbose_name='Email для уведомлений',
        help_text='Список email через запятую'
    )
    
    # Настройки сохранения
    save_submissions = models.BooleanField(default=True, verbose_name='Сохранять отправки')
    
    template = 'garpix_page/components/form.html'
    
    class Meta:
        verbose_name = 'Форма | Form'
        verbose_name_plural = 'Формы | Forms'
    
    def __str__(self):
        return f"{self.title} - {self.form_title}"
    
    def get_notification_emails_list(self):
        """Получить список email адресов для уведомлений"""
        if not self.notification_emails:
            return []
        return [email.strip() for email in self.notification_emails.split(',') if email.strip()]
    
    def get_form_fields(self):
        """Получить список полей формы"""
        return self.form_config.get('fields', [])
    
    def get_form_settings(self):
        """Получить настройки формы"""
        return {
            'form_title': self.form_title,
            'form_description': self.form_description,
            'submit_text': self.submit_text,
            'success_message': self.success_message,
            'email_notifications': self.email_notifications,
            'notification_emails': self.get_notification_emails_list(),
            'save_submissions': self.save_submissions,
        }
