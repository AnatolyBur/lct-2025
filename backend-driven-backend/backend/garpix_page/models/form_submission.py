from django.db import models
from django.contrib.auth.models import User
from .components.form_component import FormComponent

class FormSubmission(models.Model):
    """
    Отправка формы
    """
    form = models.ForeignKey(FormComponent, on_delete=models.CASCADE, verbose_name='Форма')
    submitted_data = models.JSONField(verbose_name='Данные отправки')
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата отправки')
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name='IP адрес')
    user_agent = models.TextField(blank=True, verbose_name='User Agent')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Пользователь')
    
    class Meta:
        verbose_name = 'Отправка формы | Form Submission'
        verbose_name_plural = 'Отправки форм | Form Submissions'
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.form.title} - {self.submitted_at.strftime('%d.%m.%Y %H:%M')}"
    
    def get_field_value(self, field_name):
        """Получить значение поля из отправленных данных"""
        return self.submitted_data.get(field_name, '')
    
    def get_display_data(self):
        """Получить данные для отображения в админке"""
        display_data = {}
        form_fields = self.form.get_form_fields()
        
        for field in form_fields:
            field_name = field.get('name')
            field_label = field.get('label', field_name)
            field_value = self.get_field_value(field_name)
            
            # Форматирование значения в зависимости от типа поля
            if field.get('type') == 'checkbox':
                field_value = 'Да' if field_value else 'Нет'
            elif field.get('type') == 'file' and field_value:
                field_value = f"Файл: {field_value}"
            
            display_data[field_label] = field_value
        
        return display_data
