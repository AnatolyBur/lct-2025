from django.db import models
from garpix_page.models import BasePage

from .product import ProductPage


class Order(models.Model):
    """
    Заказ, оформленный пользователем или гостем.
    Хранит контактные данные, статус, итоговую сумму и информацию о доставке.
    """

    class Status(models.TextChoices):
        PENDING = 'pending', 'Ожидает подтверждения/оплаты'
        PAID = 'paid', 'Оплачен'
        SHIPPED = 'shipped', 'Отправлен'
        DELIVERED = 'delivered', 'Доставлен'
        CANCELLED = 'cancelled', 'Отменён'

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    session_key = models.CharField(max_length=40, db_index=True)
    email = models.EmailField('Email', blank=True, default='')
    phone = models.CharField('Телефон', max_length=32, blank=True, default='')
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    total = models.DecimalField(
        'Сумма', max_digits=12, decimal_places=2, default=0
    )
    delivery_address = models.CharField(
        'Адрес доставки', max_length=255, blank=True, default=''
    )
    comment = models.TextField('Комментарий', blank=True, default='')

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        indexes = [
            models.Index(fields=['session_key']),
            models.Index(fields=['status'])
        ]

    def __str__(self):
        return f'Order #{self.pk} ({self.get_status_display()})'


class OrderItem(models.Model):
    """
    Позиция внутри заказа.
    Содержит ссылку на конкретный товар, его цену на момент оформления и количество.
    """

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='items'
    )
    product = models.ForeignKey(ProductPage, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(
        'Цена позиции', max_digits=12, decimal_places=2
    )

    class Meta:
        verbose_name = 'Товар в заказе'
        verbose_name_plural = 'Товары в заказе'


class CheckoutPage(BasePage):
    """
    Страница оформления заказа.
    Используется для отображения формы ввода данных покупателя и подтверждения заказа.
    """

    template = 'pages/checkout.html'

    class Meta:
        verbose_name = 'Оформление заказа'
        verbose_name_plural = 'Оформления заказа'
