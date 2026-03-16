from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def send_reset_password_email(user, reset_link):
    """
    Function to send reset password link email to user
    """
    subject = 'Request to reset password - StudyFlax'

    html_message = render_to_string("emails/reset_password.html", {'user': user, 'reset_link': reset_link})
    plain_html_message = strip_tags(html_message)

    send_mail(
        subject=subject,
        message=plain_html_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )
