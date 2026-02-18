# syntax=docker/dockerfile:1

FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY flax-10-project-files/frontend/package*.json ./
RUN npm ci

COPY flax-10-project-files/frontend/ ./
RUN npm run build

FROM python:3.14.3-bookworm AS runtime
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=Flax10.settings

COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY flax-10-project-files/backend/ /app/
COPY --from=frontend-builder /app/frontend/dist /app/studyFlax/static/

EXPOSE 8080

ADD /app/staticfiles

CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic"]