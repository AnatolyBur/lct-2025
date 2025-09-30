from django.db import models


class Layout(models.Model):
    name = models.CharField(max_length=255, verbose_name='Название')
    code = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Код',
        help_text='Уникальный код раскладки (slug)'
    )

    class Meta:
        verbose_name = 'Раскладка'
        verbose_name_plural = 'Раскладки'
        ordering = ('name',)

    def __str__(self):
        return self.name
