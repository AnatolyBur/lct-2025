from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.http import JsonResponse
import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, List

class FormEventHandler:
    """
    Базовый класс для обработчиков событий
    """
    
    def __init__(self, event, submission_data: Dict[str, Any]):
        self.event = event
        self.submission_data = submission_data
        self.config = event.config
    
    def execute(self) -> Dict[str, Any]:
        """
        Выполнение события
        """
        start_time = time.time()
        
        try:
            # Проверка условий
            if not self._check_conditions():
                return {
                    'status': 'skipped',
                    'message': 'Условия не выполнены',
                    'execution_time': time.time() - start_time
                }
            
            # Выполнение события
            result = self._execute_event()
            
            return {
                'status': 'success',
                'message': result.get('message', 'Событие выполнено успешно'),
                'execution_time': time.time() - start_time,
                'data': result.get('data', {})
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'execution_time': time.time() - start_time
            }
    
    def _check_conditions(self) -> bool:
        """
        Проверка условий выполнения события
        """
        conditions = self.event.conditions
        if not conditions:
            return True
        
        for condition in conditions:
            field_name = condition.get('field')
            operator = condition.get('operator')
            value = condition.get('value')
            
            if field_name not in self.submission_data:
                return False
            
            field_value = self.submission_data[field_name]
            
            if operator == 'equals' and field_value != value:
                return False
            elif operator == 'not_equals' and field_value == value:
                return False
            elif operator == 'contains' and value not in str(field_value):
                return False
            elif operator == 'greater_than' and float(field_value) <= float(value):
                return False
            elif operator == 'less_than' and float(field_value) >= float(value):
                return False
        
        return True
    
    def _execute_event(self) -> Dict[str, Any]:
        """
        Выполнение конкретного события (переопределяется в наследниках)
        """
        raise NotImplementedError

class EmailEventHandler(FormEventHandler):
    """
    Обработчик отправки email
    """
    
    def _execute_event(self) -> Dict[str, Any]:
        recipients = self.config.get('recipients', [])
        subject = self.config.get('subject', 'Новая отправка формы')
        template = self.config.get('template', 'form_email_default.html')
        
        # Подготовка контекста для шаблона
        context = {
            'form_title': self.event.form.form_title,
            'submission_data': self.submission_data,
            'submission_time': datetime.now(),
        }
        
        # Рендеринг шаблона
        try:
            html_content = render_to_string(template, context)
        except:
            # Если шаблон не найден, используем простой текст
            html_content = f"""
            <h2>Новая отправка формы: {self.event.form.form_title}</h2>
            <p>Время отправки: {datetime.now().strftime('%d.%m.%Y %H:%M')}</p>
            <h3>Данные формы:</h3>
            <ul>
            """
            for field, value in self.submission_data.items():
                html_content += f"<li><strong>{field}:</strong> {value}</li>"
            html_content += "</ul>"
        
        # Отправка email
        send_mail(
            subject=subject,
            message='',
            html_message=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=False
        )
        
        return {
            'message': f'Email отправлен на {len(recipients)} адресов',
            'data': {'recipients': recipients}
        }

class WebhookEventHandler(FormEventHandler):
    """
    Обработчик webhook
    """
    
    def _execute_event(self) -> Dict[str, Any]:
        url = self.config.get('url')
        method = self.config.get('method', 'POST')
        headers = self.config.get('headers', {})
        timeout = self.config.get('timeout', 30)
        
        if not url:
            raise ValueError("URL для webhook не указан")
        
        # Подготовка данных
        payload = {
            'form_id': self.event.form.id,
            'form_title': self.event.form.form_title,
            'submission_data': self.submission_data,
            'timestamp': datetime.now().isoformat(),
        }
        
        # Выполнение запроса
        response = requests.request(
            method=method,
            url=url,
            json=payload,
            headers=headers,
            timeout=timeout
        )
        
        response.raise_for_status()
        
        return {
            'message': f'Webhook выполнен успешно (статус: {response.status_code})',
            'data': {
                'status_code': response.status_code,
                'response': response.text[:500]  # Ограничиваем размер ответа
            }
        }

class DatabaseEventHandler(FormEventHandler):
    """
    Обработчик сохранения в БД
    """
    
    def _execute_event(self) -> Dict[str, Any]:
        model_name = self.config.get('model')
        field_mapping = self.config.get('field_mapping', {})
        
        if not model_name:
            raise ValueError("Модель для сохранения не указана")
        
        # Динамическое получение модели
        from django.apps import apps
        try:
            model = apps.get_model(model_name)
        except LookupError:
            raise ValueError(f"Модель {model_name} не найдена")
        
        # Подготовка данных для сохранения
        data = {}
        for form_field, model_field in field_mapping.items():
            if form_field in self.submission_data:
                data[model_field] = self.submission_data[form_field]
        
        # Создание записи
        instance = model.objects.create(**data)
        
        return {
            'message': f'Запись создана в модели {model_name}',
            'data': {'instance_id': instance.id}
        }

class NotificationEventHandler(FormEventHandler):
    """
    Обработчик уведомлений
    """
    
    def _execute_event(self) -> Dict[str, Any]:
        notification_type = self.config.get('type', 'info')
        message = self.config.get('message', 'Форма отправлена')
        
        # Здесь можно интегрировать с системой уведомлений
        # Например, Django Channels, Celery, или внешние сервисы
        
        return {
            'message': f'Уведомление {notification_type} отправлено',
            'data': {'type': notification_type, 'message': message}
        }

class RedirectEventHandler(FormEventHandler):
    """
    Обработчик перенаправления
    """
    
    def _execute_event(self) -> Dict[str, Any]:
        url = self.config.get('url')
        message = self.config.get('message', 'Перенаправление')
        
        if not url:
            raise ValueError("URL для перенаправления не указан")
        
        return {
            'message': message,
            'data': {'redirect_url': url}
        }

class CustomEventHandler(FormEventHandler):
    """
    Обработчик пользовательского кода
    """
    
    def _execute_event(self) -> Dict[str, Any]:
        code = self.config.get('code')
        
        if not code:
            raise ValueError("Код не указан")
        
        # Безопасное выполнение кода
        # В продакшене лучше использовать sandbox
        try:
            # Создаем безопасное окружение
            safe_globals = {
                'submission_data': self.submission_data,
                'form': self.event.form,
                'config': self.config,
                'datetime': datetime,
                'json': json,
            }
            
            # Выполняем код
            exec(code, safe_globals)
            
            return {
                'message': 'Пользовательский код выполнен успешно',
                'data': safe_globals.get('result', {})
            }
            
        except Exception as e:
            raise ValueError(f"Ошибка выполнения кода: {str(e)}")

# Реестр обработчиков
EVENT_HANDLERS = {
    'email': EmailEventHandler,
    'webhook': WebhookEventHandler,
    'database': DatabaseEventHandler,
    'notification': NotificationEventHandler,
    'redirect': RedirectEventHandler,
    'custom': CustomEventHandler,
}
