from modeltranslation.translator import TranslationOptions, register
from ..models import CartPage


@register(CartPage)
class CartPageTranslationOptions(TranslationOptions):
    fields = ()


