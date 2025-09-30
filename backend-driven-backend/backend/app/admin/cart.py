from django.contrib import admin
from garpix_page.admin import BasePageAdmin

from ..models import Cart, CartItem, CartPage


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'session_key', 'created_at', 'updated_at')
    search_fields = ('session_key',)
    inlines = [CartItemInline]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'cart', 'product', 'quantity')
    list_filter = ('cart',)
    search_fields = ('cart__session_key', 'product__title')


@admin.register(CartPage)
class CartPageAdmin(BasePageAdmin):
    pass
