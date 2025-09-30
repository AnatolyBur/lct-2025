from django.db import models

from garpix_page.models import BasePage
from .product import ProductPage


class Cart(models.Model):
    """
    Корзина пользователя.
    """

    session_key = models.CharField(
        max_length=40, null=True, blank=True, db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Корзина'
        verbose_name_plural = 'Корзины'
        indexes = [models.Index(fields=['session_key'])]

    def __str__(self):
        return f'Cart({self.session_key})'

    @property
    def total(self):
        return sum(i.quantity * i.price_snapshot for i in self.items.all())


class CartItem(models.Model):
    """
    Позиция в корзине.
    Описывает выбранный товар и количество, а также фиксирует цену на момент добавления.
    """

    cart = models.ForeignKey(
        Cart, on_delete=models.CASCADE, related_name='items'
    )
    product = models.ForeignKey(ProductPage, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price_snapshot = models.DecimalField(
        'Цена на момент добавления', max_digits=12, decimal_places=2
    )

    class Meta:
        verbose_name = 'Позиция в корзине'
        verbose_name_plural = 'Позиции в корзине'
        constraints = [
            models.UniqueConstraint(
                fields=['cart', 'product'], name='uniq_cart_product'
            )
        ]


class CartPage(BasePage):
    """
    Страница корзины.
    Отображает все позиции текущего пользователя или сессии и позволяет изменить их перед оформлением заказа.
    """

    template = 'pages/cart.html'

    class Meta:
        verbose_name = 'Страница корзины'
        verbose_name_plural = 'Страницы корзины'
