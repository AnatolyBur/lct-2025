from django.contrib import admin

from ..models import Layout


@admin.register(Layout)
class LayoutAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code')
    search_fields = ('name', 'code')
