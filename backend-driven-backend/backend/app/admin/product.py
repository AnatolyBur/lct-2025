from django.contrib import admin
from garpix_page.admin import BasePageAdmin

from ..models import ProductImage, ProductPage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(ProductPage)
class ProductPageAdmin(BasePageAdmin):
    inlines = [ProductImageInline]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'sort')
    list_filter = ('product',)
    search_fields = ('product__title',)
