"""
Analytics AI prompts and message builders.
"""

SCHEDULE_EXTRACTION_PROMPT = (
    "You are a schedule parser. Extract any study/work schedule events from the given text.\n"
    "Return ONLY a JSON array of events. If no schedule is present, return [].\n"
    "Each event must have: title (string), start_time (ISO 8601 datetime), end_time (ISO 8601 datetime), description (string).\n"
    "Resolve relative day names (e.g. 'Monday') to absolute dates using the current date provided.\n"
    "If no end time is specified, assume 1 hour after start. Use 24-hour times.\n"
    "Return nothing except valid JSON."
)

SYSTEM_PROMPT = (
    "You are StudyFlax AI, a friendly and insightful study coach built into a student time management app.\n"
    "You have access to the student's real study data - their sessions, patterns, calendar, and habits.\n"
    "Give personalised, actionable advice based on their actual data.\n"
    "Be encouraging but honest. Keep responses concise (2-4 paragraphs max unless asked for a schedule).\n"
    "When suggesting schedules, use specific times based on their peak study hours.\n"
    "Format schedule recommendations as clear bullet points with times.\n"
    "Never make up data - only reference what's in the context provided."
)

INSIGHT_PROMPT_TEMPLATE = (
    "Based on this student's study data, provide:\n"
    "1. A brief personalised summary of their study patterns (2-3 sentences)\n"
    "2. Their top 2-3 strengths as a student based on the data\n"
    "3. Their top 2-3 areas for improvement\n"
    "4. A recommended daily study schedule for this week based on their peak hours and upcoming events\n\n"
    "Student data:\n{context}"
)


def build_insight_messages(context):
    return [
        {'role': 'system', 'content': SYSTEM_PROMPT},
        {'role': 'user', 'content': INSIGHT_PROMPT_TEMPLATE.format(context=context)},
    ]


def build_schedule_messages(reply_text, today_str):
    return [
        {'role': 'system', 'content': SCHEDULE_EXTRACTION_PROMPT},
        {'role': 'user', 'content': f"Today is {today_str}.\n\n{reply_text}"},
    ]


def sanitise_messages(messages):
    return [{'role': item['role'], 'content': item['content']} for item in messages if 'role' in item and 'content' in item]
