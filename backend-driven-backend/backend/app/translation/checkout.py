from modeltranslation.translator import TranslationOptions, register
from ..models import CheckoutPage


@register(CheckoutPage)
class CheckoutPageTranslationOptions(TranslationOptions):
    fields = ()


