from django.db import models

from garpix_page.models import BasePage


class Preview(BasePage):
    template = 'pages/default.html'

    class Meta:
        verbose_name = "Превью"
        verbose_name_plural = "Превью"
        ordering = ('-created_at',)
