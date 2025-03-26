from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth.models import User
from users.models import Usuario
import logging

logger = logging.getLogger(__name__)


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):

    def pre_social_login(self, request, sociallogin):
        if request.user.is_authenticated:
            return
        email = sociallogin.account.extra_data.get('email')
        if not email:
            return
        try:
            user = User.objects.get(email=email)
            sociallogin.connect(request, user)
        except User.DoesNotExist:
            pass

    def is_open_for_signup(self, request, sociallogin):
        return True

    def populate_user(self, request, sociallogin, data):
        logger.info(f"populate_user - Received data: {data}")
        user = super().populate_user(request, sociallogin, data)
        extra_data = sociallogin.account.extra_data
        user.first_name = data.get('first_name') or extra_data.get('given_name', '')
        user.last_name = data.get('last_name') or extra_data.get('family_name', '')
        logger.info(f"populate_user - After setting: first_name={user.first_name}, last_name={user.last_name}")
        return user

    def save_user(self, request, sociallogin, form=None):
        user = super().save_user(request, sociallogin, form)
        extra_data = sociallogin.account.extra_data
        logger.info(f"save_user - Before Usuario check: first_name={user.first_name}, last_name={user.last_name}")
        try:
            usuario = user.usuario
        except Usuario.DoesNotExist:
            try:
                usuario = Usuario.objects.create(
                    user=user,
                    name=user.first_name or extra_data.get('given_name', ''),
                    surname=user.last_name or extra_data.get('family_name', ''),
                    email=user.email,
                    phone='',
                    birthdate='2000-01-01',
                )
                logger.info(f"save_user - Created Usuario: name={usuario.name}, surname={usuario.surname}")
            except Exception as e:
                logger.error(f"save_user - Error creating Usuario: {e}")
                raise
        return user
