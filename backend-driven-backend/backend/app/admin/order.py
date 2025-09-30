from django.contrib import admin
from garpix_page.admin import BasePageAdmin

from ..models import CheckoutPage, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'total', 'email', 'phone', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('email', 'phone', 'session_key')
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'product', 'quantity', 'price')
    list_filter = ('order',)
    search_fields = ('order__id', 'product__title')


@admin.register(CheckoutPage)
class CheckoutPageAdmin(BasePageAdmin):
    pass
