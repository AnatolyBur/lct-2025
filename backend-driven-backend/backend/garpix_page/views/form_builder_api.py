"""
API views для конструктора форм
Реализует эндпоинты для управления формами, событиями и отправками
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.conf import settings
import json
from datetime import datetime

from ..models.components.form_component import FormComponent
from ..models.form_submission import FormSubmission
from ..models.form_event import FormEvent, FormEventLog
from ..handlers.form_event_handlers import EVENT_HANDLERS
from ..serializers.serializer import get_serializer


@api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def form_builder_config(request, form_id=None):
    """
    GET /api/admin/forms/{id}/config/ - Получить конфигурацию формы
    POST /api/admin/forms/{id}/config/ - Сохранить конфигурацию формы
    """
    if request.method == 'GET':
        if form_id:
            form = get_object_or_404(FormComponent, id=form_id)
            return Response({
                'id': form.id,
                'title': form.title,
                'form_config': form.form_config,
                'form_title': form.form_title,
                'form_description': form.form_description,
                'submit_text': form.submit_text,
                'success_message': form.success_message,
                'email_notifications': form.email_notifications,
                'notification_emails': form.notification_emails,
                'save_submissions': form.save_submissions,
                'is_active': form.is_active,
                'created_at': form.created_at,
                'updated_at': form.updated_at,
            })
        else:
            # Возвращаем список всех форм
            forms = FormComponent.objects.filter(is_deleted=False)
            return Response([{
                'id': form.id,
                'title': form.title,
                'form_title': form.form_title,
                'is_active': form.is_active,
                'created_at': form.created_at,
                'updated_at': form.updated_at,
            } for form in forms])
    
    elif request.method == 'POST':
        data = request.data
        
        if form_id:
            # Обновление существующей формы
            form = get_object_or_404(FormComponent, id=form_id)
            form.title = data.get('title', form.title)
            form.form_config = data.get('form_config', form.form_config)
            form.form_title = data.get('form_title', form.form_title)
            form.form_description = data.get('form_description', form.form_description)
            form.submit_text = data.get('submit_text', form.submit_text)
            form.success_message = data.get('success_message', form.success_message)
            form.email_notifications = data.get('email_notifications', form.email_notifications)
            form.notification_emails = data.get('notification_emails', form.notification_emails)
            form.save_submissions = data.get('save_submissions', form.save_submissions)
            form.is_active = data.get('is_active', form.is_active)
            form.save()
        else:
            # Создание новой формы
            form = FormComponent.objects.create(
                title=data.get('title', 'Новая форма'),
                form_title=data.get('form_title', 'Новая форма'),
                form_description=data.get('form_description', ''),
                form_config=data.get('form_config', {}),
                submit_text=data.get('submit_text', 'Отправить'),
                success_message=data.get('success_message', 'Форма успешно отправлена!'),
                email_notifications=data.get('email_notifications', False),
                notification_emails=data.get('notification_emails', ''),
                save_submissions=data.get('save_submissions', True),
                is_active=data.get('is_active', True),
            )
        
        return Response({
            'id': form.id,
            'title': form.title,
            'form_config': form.form_config,
            'form_title': form.form_title,
            'form_description': form.form_description,
            'submit_text': form.submit_text,
            'success_message': form.success_message,
            'email_notifications': form.email_notifications,
            'notification_emails': form.notification_emails,
            'save_submissions': form.save_submissions,
            'is_active': form.is_active,
            'created_at': form.created_at,
            'updated_at': form.updated_at,
        }, status=status.HTTP_201_CREATED if not form_id else status.HTTP_200_OK)


@api_view(['POST'])
def form_submit(request, form_id):
    """
    POST /api/forms/{id}/submit/ - Отправка формы с обработкой событий
    """
    form = get_object_or_404(FormComponent, id=form_id, is_active=True)
    
    # Валидация данных формы
    form_config = form.form_config
    validation_errors = {}
    
    for field in form_config.get('fields', []):
        field_name = field.get('name')
        field_value = request.data.get(field_name)
        
        # Проверка обязательности
        if field.get('required') and not field_value:
            validation_errors[field_name] = f'Поле "{field.get("label")}" обязательно для заполнения'
        
        # Дополнительная валидация по типу поля
        if field_value and field.get('type') == 'email':
            from django.core.validators import validate_email
            from django.core.exceptions import ValidationError
            try:
                validate_email(field_value)
            except ValidationError:
                validation_errors[field_name] = 'Введите корректный email адрес'
    
    if validation_errors:
        return Response({'errors': validation_errors}, status=status.HTTP_400_BAD_REQUEST)
    
    # Сохранение отправки и выполнение событий
    with transaction.atomic():
        # Создание записи об отправке
        submission = FormSubmission.objects.create(
            form=form,
            submitted_data=request.data,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            user=request.user if request.user.is_authenticated else None
        )
        
        # Получение активных событий
        events = FormEvent.objects.filter(
            form=form,
            is_active=True
        ).order_by('order', 'created_at')
        
        # Выполнение событий
        event_results = []
        redirect_url = None
        
        for event in events:
            handler_class = EVENT_HANDLERS.get(event.event_type)
            if not handler_class:
                continue
            
            handler = handler_class(event, request.data)
            result = handler.execute()
            
            # Логирование результата
            FormEventLog.objects.create(
                event=event,
                submission=submission,
                status=result['status'],
                message=result['message'],
                execution_time=result.get('execution_time')
            )
            
            event_results.append({
                'event_name': event.name,
                'event_type': event.event_type,
                'status': result['status'],
                'message': result['message']
            })
            
            # Если событие - перенаправление, сохраняем URL
            if event.event_type == 'redirect' and result['status'] == 'success':
                redirect_url = result.get('data', {}).get('redirect_url')
    
    # Формирование ответа
    response_data = {
        'success': True,
        'message': form.success_message,
        'submission_id': submission.id,
        'events': event_results
    }
    
    if redirect_url:
        response_data['redirect_url'] = redirect_url
    
    return Response(response_data)


@api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def form_events(request, form_id):
    """
    GET /api/admin/forms/{id}/events/ - Получить события формы
    POST /api/admin/forms/{id}/events/ - Создать событие формы
    """
    form = get_object_or_404(FormComponent, id=form_id)
    
    if request.method == 'GET':
        events = FormEvent.objects.filter(form=form).order_by('order', 'created_at')
        return Response([{
            'id': event.id,
            'name': event.name,
            'event_type': event.event_type,
            'is_active': event.is_active,
            'order': event.order,
            'config': event.config,
            'conditions': event.conditions,
            'created_at': event.created_at,
            'updated_at': event.updated_at,
        } for event in events])
    
    elif request.method == 'POST':
        data = request.data
        
        event = FormEvent.objects.create(
            form=form,
            name=data.get('name'),
            event_type=data.get('event_type'),
            is_active=data.get('is_active', True),
            order=data.get('order', 0),
            config=data.get('config', {}),
            conditions=data.get('conditions', [])
        )
        
        return Response({
            'id': event.id,
            'name': event.name,
            'event_type': event.event_type,
            'is_active': event.is_active,
            'order': event.order,
            'config': event.config,
            'conditions': event.conditions,
            'created_at': event.created_at,
            'updated_at': event.updated_at,
        }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def form_event_detail(request, form_id, event_id):
    """
    GET /api/admin/forms/{id}/events/{event_id}/ - Получить событие
    PUT /api/admin/forms/{id}/events/{event_id}/ - Обновить событие
    DELETE /api/admin/forms/{id}/events/{event_id}/ - Удалить событие
    """
    form = get_object_or_404(FormComponent, id=form_id)
    event = get_object_or_404(FormEvent, id=event_id, form=form)
    
    if request.method == 'GET':
        return Response({
            'id': event.id,
            'name': event.name,
            'event_type': event.event_type,
            'is_active': event.is_active,
            'order': event.order,
            'config': event.config,
            'conditions': event.conditions,
            'created_at': event.created_at,
            'updated_at': event.updated_at,
        })
    
    elif request.method == 'PUT':
        data = request.data
        
        event.name = data.get('name', event.name)
        event.event_type = data.get('event_type', event.event_type)
        event.is_active = data.get('is_active', event.is_active)
        event.order = data.get('order', event.order)
        event.config = data.get('config', event.config)
        event.conditions = data.get('conditions', event.conditions)
        event.save()
        
        return Response({
            'id': event.id,
            'name': event.name,
            'event_type': event.event_type,
            'is_active': event.is_active,
            'order': event.order,
            'config': event.config,
            'conditions': event.conditions,
            'created_at': event.created_at,
            'updated_at': event.updated_at,
        })
    
    elif request.method == 'DELETE':
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def form_submissions(request, form_id):
    """
    GET /api/admin/forms/{id}/submissions/ - Получить отправки формы
    """
    form = get_object_or_404(FormComponent, id=form_id)
    submissions = FormSubmission.objects.filter(form=form).order_by('-submitted_at')
    
    return Response([{
        'id': submission.id,
        'submitted_data': submission.submitted_data,
        'submitted_at': submission.submitted_at,
        'ip_address': submission.ip_address,
        'user': submission.user.username if submission.user else None,
    } for submission in submissions])


@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def form_event_logs(request, form_id, event_id=None):
    """
    GET /api/admin/forms/{id}/events/{event_id}/logs/ - Получить логи событий
    """
    form = get_object_or_404(FormComponent, id=form_id)
    
    if event_id:
        event = get_object_or_404(FormEvent, id=event_id, form=form)
        logs = FormEventLog.objects.filter(event=event).order_by('-created_at')
    else:
        logs = FormEventLog.objects.filter(event__form=form).order_by('-created_at')
    
    return Response([{
        'id': log.id,
        'event_name': log.event.name,
        'event_type': log.event.event_type,
        'status': log.status,
        'message': log.message,
        'execution_time': log.execution_time,
        'created_at': log.created_at,
    } for log in logs])
