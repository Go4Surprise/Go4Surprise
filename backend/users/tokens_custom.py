from django.contrib.auth.tokens import PasswordResetTokenGenerator

class CustomPasswordResetTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return f"{user.id}{timestamp}"

custom_token_generator = CustomPasswordResetTokenGenerator()