# Generated by Django 5.1.7 on 2025-03-25 16:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('experiences', '0005_experience_notas_adicionales_alter_experience_price'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='experience',
            name='duration',
        ),
        migrations.AddField(
            model_name='experience',
            name='time_preference',
            field=models.CharField(choices=[('MORNING', 'Mañana'), ('AFTERNOON', 'Tarde'), ('NIGHT', 'Noche')], default='MORNING', help_text='Preferencia de horario para la reserva.', max_length=10),
        ),
    ]
