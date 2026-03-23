from pathlib import Path
import os
from dotenv import load_dotenv
import dj_database_url
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*_args, **_kwargs):
        return False

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-(l2qj8!(^0f3qiud=0p%axr83f&70wncfz(yehna)2c&e55ox&'
DEBUG = False
ALLOWED_HOSTS = [os.environ.get("RAILWAY_PRIVATE_DOMAIN"), "localhost"]

CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ORIGIN", "").split(",")

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_vite',
    'rest_framework',
    'studyFlax',
    'rest_framework.authtoken',
    'corsheaders',
]

AUTH_USER_MODEL = 'studyFlax.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'Flax10.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'studyFlax' / 'templates',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Flax10.wsgi.application'

DATABASES = {
    "default": dj_database_url.parse(
        os.environ.get("DATABASE_URL"),
	conn_max_age=600,
	ssl_require=True,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

FRONTEND_DIST_DIR = BASE_DIR / 'frontend' / 'dist'

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    FRONTEND_DIST_DIR,
    BASE_DIR / 'studyFlax' / 'fixtures' ,
]
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'StudyFlax@gmail.com'
EMAIL_HOST_PASSWORD = 'xmgwyxrbevcqlevu'
DEFAULT_FROM_EMAIL = 'StudyFlax <StudyFlax@gmail.com>'

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

DJANGO_VITE = {
  "default": {
    "dev_mode": False,
    'manifest_path': FRONTEND_DIST_DIR / '.vite' / 'manifest.json',
  }
}
