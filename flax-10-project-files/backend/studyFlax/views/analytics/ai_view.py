"""
Analytics AI API views.
"""

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .ai_context import build_user_context
from .ai_prompts import SYSTEM_PROMPT, build_insight_messages, build_schedule_messages, sanitise_messages
from .ai_schedule import parse_schedule_events

try:
    import openai
    OpenAI = getattr(openai, 'OpenAI', None)
    OpenAIError = getattr(openai, "OpenAIError", Exception)
    openai_available = OpenAI is not None
except ImportError:
    OpenAI = None
    OpenAIError = Exception
    openai_available = False

OPENAI_API_ERROR_TYPES = (OpenAIError, IndexError, TypeError, KeyError, AttributeError, Exception)


def _response_error(message, code):
    return Response({'error': message}, status=code)


def _check_openai():
    if not openai_available:
        return None, _response_error('OpenAI package not installed', status.HTTP_503_SERVICE_UNAVAILABLE)
    api_key = getattr(settings, 'OPENAI_API_KEY', None)
    if not api_key:
        return None, _response_error('OpenAI API key not configured', status.HTTP_503_SERVICE_UNAVAILABLE)
    return api_key, None

def _build_user_context(user, days=30):
    return build_user_context(user, days)


def _extract_days(value, default=30):
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

def _handle_openai_error(exc):
    return _response_error(str(exc), status.HTTP_500_INTERNAL_SERVER_ERROR)


def _days_or_error(request, default=30):
    days = _extract_days(request.data.get('days'), default)
    if days is None:
        return None, _response_error('days must be an integer', status.HTTP_400_BAD_REQUEST)
    return days, None


def _is_openai_response_valid(response):
    choices = getattr(response, "choices", None) or []
    if not choices:
        return False
    first = choices[0]
    message = getattr(first, "message", None)
    return getattr(message, "content", None) is not None


def _chat_request_or_error(request):
    messages = request.data.get('messages', [])
    if not messages:
        return None, _response_error('messages array required', status.HTTP_400_BAD_REQUEST)
    days = _extract_days(request.data.get('days'), 30)
    if days is None:
        return None, _response_error('days must be an integer', status.HTTP_400_BAD_REQUEST)
    context = _build_user_context(request.user, days)
    system_msg = f"{SYSTEM_PROMPT}\n\nCurrent student data:\n{context}"
    return {'messages': sanitise_messages(messages), 'system_msg': system_msg}, None


def _fetch_schedule_response(api_key, reply_text, today_str):
    messages = build_schedule_messages(reply_text, today_str)
    return _openai_response_or_error(api_key, messages, max_tokens=400, model='gpt-4o-mini')


def _extract_schedule_events(api_key, reply_text, today_str):
    response, err = _fetch_schedule_response(api_key, reply_text, today_str)
    if err:
        return []
    content, err = _content_or_error(response)
    if err:
        return []
    return parse_schedule_events(content)


def _call_openai(api_key, messages, max_tokens=800, model='gpt-4o'):
    client = OpenAI(api_key=api_key)
    return client.chat.completions.create(
        model=model, messages=messages, max_tokens=max_tokens, temperature=0.7,
    )


def _openai_response_or_error(api_key, messages, max_tokens=800, model='gpt-4o'):
    try:
        return _call_openai(api_key, messages, max_tokens, model), None
    except OPENAI_API_ERROR_TYPES as exc:
        return None, _handle_openai_error(exc)


def _content_or_error(response):
    if not _is_openai_response_valid(response):
        return None, _handle_openai_error('OpenAI response was incomplete')
    return response.choices[0].message.content, None


def _chat_messages(payload):
    return [{'role': 'system', 'content': payload['system_msg']}] + payload['messages']


def _insights_payload(user, days, api_key):
    context = _build_user_context(user, days)
    response, err = _openai_response_or_error(api_key, build_insight_messages(context))
    if err:
        return None, err
    content, err = _content_or_error(response)
    if err:
        return None, err
    return {'insights': content, 'contextUsed': context}, None


def _chat_completion_payload(payload, api_key):
    response, err = _openai_response_or_error(api_key, _chat_messages(payload), 600)
    if err:
        return None, err
    content, err = _content_or_error(response)
    if err:
        return None, err
    return content, None


def _chat_payload(request, api_key):
    payload, err = _chat_request_or_error(request)
    if err:
        return None, err
    content, err = _chat_completion_payload(payload, api_key)
    if err:
        return None, err
    today_str = timezone.now().strftime('%Y-%m-%d')
    return {'reply': content, 'suggested_events': _extract_schedule_events(api_key, content, today_str)}, None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_ai_insights(request):
    api_key, err = _check_openai()
    if err:
        return err
    days, err = _days_or_error(request, 30)
    if err:
        return err
    payload, err = _insights_payload(request.user, days, api_key)
    if err:
        return err
    return Response(payload)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_chat(request):
    api_key, err = _check_openai()
    if err:
        return err
    payload, err = _chat_payload(request, api_key)
    if err:
        return err
    return Response(payload)
