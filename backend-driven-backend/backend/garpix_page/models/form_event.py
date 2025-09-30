from django.db import models
from django.contrib.auth.models import User
from .components.form_component import FormComponent
import json

class FormEvent(models.Model):
    """
    Событие, которое выполняется при отправке формы
    """
    EVENT_TYPES = [
        ('email', 'Отправка email'),
        ('webhook', 'Webhook'),
        ('database', 'Сохранение в БД'),
        ('notification', 'Уведомление'),
        ('redirect', 'Перенаправление'),
        ('custom', 'Пользовательский код'),
    ]
    
    form = models.ForeignKey(FormComponent, on_delete=models.CASCADE, related_name='events', verbose_name='Форма')
    name = models.CharField(max_length=255, verbose_name='Название события')
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES, verbose_name='Тип события')
    is_active = models.BooleanField(default=True, verbose_name='Активно')
    order = models.IntegerField(default=0, verbose_name='Порядок выполнения')
    
    # Конфигурация события в JSON
    config = models.JSONField(default=dict, verbose_name='Конфигурация события')
    
    # Условия выполнения
    conditions = models.JSONField(default=list, verbose_name='Условия выполнения')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата изменения')
    
    class Meta:
        verbose_name = 'Событие формы | Form Event'
        verbose_name_plural = 'События форм | Form Events'
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.form.title} - {self.name}"
    
    def get_conditions_display(self):
        """Получить отображение условий для админки"""
        if not self.conditions:
            return "Без условий"
        
        condition_texts = []
        for condition in self.conditions:
            field = condition.get('field', '')
            operator = condition.get('operator', '')
            value = condition.get('value', '')
            
            operator_display = {
                'equals': 'равно',
                'not_equals': 'не равно',
                'contains': 'содержит',
                'greater_than': 'больше',
                'less_than': 'меньше',
            }.get(operator, operator)
            
            condition_texts.append(f"{field} {operator_display} {value}")
        
        return "; ".join(condition_texts)

class FormEventLog(models.Model):
    """
    Лог выполнения событий
    """
    event = models.ForeignKey(FormEvent, on_delete=models.CASCADE, related_name='logs', verbose_name='Событие')
    submission = models.ForeignKey('FormSubmission', on_delete=models.CASCADE, related_name='event_logs', verbose_name='Отправка')
    status = models.CharField(max_length=20, choices=[
        ('success', 'Успешно'),
        ('error', 'Ошибка'),
        ('skipped', 'Пропущено'),
    ], verbose_name='Статус')
    message = models.TextField(blank=True, verbose_name='Сообщение')
    execution_time = models.FloatField(null=True, blank=True, verbose_name='Время выполнения (сек)')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата выполнения')
    
    class Meta:
        verbose_name = 'Лог события | Event Log'
        verbose_name_plural = 'Логи событий | Event Logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.event.name} - {self.get_status_display()} - {self.created_at.strftime('%d.%m.%Y %H:%M')}"
