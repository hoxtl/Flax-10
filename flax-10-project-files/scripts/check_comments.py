#!/usr/bin/env python3
"""
Comment Quality Checker - BAND V COMPLIANCE
Checks: banner comments | American spelling | emojis | arrow text | excessive decoration
"""

import os
import re

# ANSI Colors
class Colors:
    RED = '\033[91m'
    YELLOW = '\033[33m'
    MAGENTA = '\033[95m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header():
    print(f"\n{'='*75}")
    print(f"{Colors.BOLD}{Colors.MAGENTA}{'COMMENT QUALITY REPORT - PYTHON'.center(75)}{Colors.END}")
    print(f"{'='*75}")
    print("Rules: No banners | British spelling | No emojis | No arrow text")
    print("       No excessive decoration\n")

def print_section(number, title):
    print(f"\n{Colors.BOLD}{Colors.YELLOW}{number}. {title}{Colors.END}")
    print(f"{'─'*75}")

def shorten_path(filepath):
    return filepath.replace('../backend/studyFlax/', '')

def is_test_file(filepath):
    return '/tests/' in filepath or os.path.basename(filepath).startswith('test_')

# American → British spelling map
SPELLING_MAP = {
    "color": "colour",
    "colors": "colours",
    "colored": "coloured",
    "coloring": "colouring",
    "colorize": "colourise",
    "favorite": "favourite",
    "favorites": "favourites",
    "favorited": "favourited",
    "favor": "favour",
    "initialize": "initialise",
    "initialized": "initialised",
    "initializing": "initialising",
    "initialization": "initialisation",
    "organize": "organise",
    "organized": "organised",
    "organizing": "organising",
    "organization": "organisation",
    "customize": "customise",
    "customized": "customised",
    "customizing": "customising",
    "customization": "customisation",
    "optimize": "optimise",
    "optimized": "optimised",
    "optimizing": "optimising",
    "optimization": "optimisation",
    "recognize": "recognise",
    "recognized": "recognised",
    "recognizing": "recognising",
    "synchronize": "synchronise",
    "synchronized": "synchronised",
    "synchronizing": "synchronising",
    "analyze": "analyse",
    "analyzed": "analysed",
    "analyzing": "analysing",
    "behavior": "behaviour",
    "behaviors": "behaviours",
    "neighbor": "neighbour",
    "neighbors": "neighbours",
    "honor": "honour",
    "honored": "honoured",
    "humor": "humour",
    "labor": "labour",
    "center": "centre",
    "centers": "centres",
    "meter": "metre",
    "meters": "metres",
    "theater": "theatre",
    "theaters": "theatres",
    "catalog": "catalogue",
    "catalogs": "catalogues",
    "dialog": "dialogue",
    "dialogs": "dialogues",
    "defense": "defence",
    "offense": "offence",
    "license": "licence",
    "practice": "practise",
    "gray": "grey",
    "canceled": "cancelled",
    "canceling": "cancelling",
    "traveled": "travelled",
    "traveling": "travelling",
    "modeled": "modelled",
    "modeling": "modelling",
    "labeled": "labelled",
    "labeling": "labelling",
    "enrollment": "enrolment",
    "fulfill": "fulfil",
    "fulfillment": "fulfilment",
    "skillful": "skilful",
}

# Code terms that use American spelling and cannot be changed
CODE_TERMS = {
    "color", "colors", "colored", "coloring",
    "gray",
    "center", "centers",
    "dialog",
    "normalize", "normalized",
    "serialize", "serialized", "deserialize", "deserialized",
    "license",
    "canceled",
    "labeled",
    "modeled", "modeling",
    "initialize", "initialized", "initializing", "initialization",
    "optimize", "optimized", "optimizing", "optimization",
    "synchronize", "synchronized", "synchronizing",
}

EMOJI_RE = re.compile(
    "[\U0001F300-\U0001F9FF\U00002600-\U000026FF\U00002700-\U000027BF"
    "\U0000FE00-\U0000FE0F\U0001FA00-\U0001FA6F\U0001FA70-\U0001FAFF"
    "\U0000200D\U000020E3]"
)

BANNER_PATTERNS = [
    re.compile(r'^\s*#\s*[-=~*#]{5,}'),         # # ------
    re.compile(r'^\s*#\s*[─━═]{3,}'),            # # ───────
    re.compile(r'^\s*#\s*[╔╗╚╝║│┌┐└┘├┤┬┴┼]'),   # Box-drawing
    re.compile(r'^\s*"""\s*[-=~*#─━═]{5,}'),     # """ ------
]

ARROW_PATTERNS = [
    re.compile(r'-->'),
    re.compile(r'<--'),
    re.compile(r'==>'),
    re.compile(r'<=='),
    re.compile(r'~>'),
    re.compile(r'<~'),
    re.compile(r'[→←⇒⇐⟶⟵]'),
]

SKIP_DIRS = {'__pycache__', 'migrations', 'venv', '.git', 'node_modules'}


def extract_comments(filepath):
    comments = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception:
        return comments

    in_docstring = False
    docstring_char = None

    for i, line in enumerate(lines):
        stripped = line.strip()
        line_num = i + 1

        # Track docstrings (skip them — they are documentation, not comments)
        if not in_docstring:
            if stripped.startswith('"""') or stripped.startswith("'''"):
                docstring_char = stripped[:3]
                if stripped.count(docstring_char) >= 2:
                    continue
                in_docstring = True
                continue
        else:
            if docstring_char in stripped:
                in_docstring = False
            continue

        # Single-line comments
        if stripped.startswith('#'):
            text = stripped[1:].strip()
            comments.append({'line': line_num, 'text': text, 'raw': line})
        elif '#' in stripped:
            idx = stripped.index('#')
            text = stripped[idx + 1:].strip()
            comments.append({'line': line_num, 'text': text, 'raw': line})

    return comments


def check_banner_comments(target_dir):
    violations = []

    for root, dirs, files in os.walk(target_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for file in files:
            if not file.endswith('.py'):
                continue

            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
            except Exception:
                continue

            for i, line in enumerate(lines):
                for pattern in BANNER_PATTERNS:
                    if pattern.search(line):
                        violations.append({
                            'file': shorten_path(filepath),
                            'line': i + 1,
                            'text': line.strip()[:60],
                            'is_test': is_test_file(filepath),
                        })
                        break

    return violations


def check_american_spelling(target_dir):
    violations = []
    american_words = set(SPELLING_MAP.keys())

    for root, dirs, files in os.walk(target_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for file in files:
            if not file.endswith('.py'):
                continue

            filepath = os.path.join(root, file)
            comments = extract_comments(filepath)

            for comment in comments:
                words = re.split(r'\W+', comment['text'].lower())
                for word in words:
                    if word in american_words and word not in CODE_TERMS:
                        violations.append({
                            'file': shorten_path(filepath),
                            'line': comment['line'],
                            'american': word,
                            'british': SPELLING_MAP[word],
                            'is_test': is_test_file(filepath),
                        })

    return violations


def check_emoji_comments(target_dir):
    violations = []

    for root, dirs, files in os.walk(target_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for file in files:
            if not file.endswith('.py'):
                continue

            filepath = os.path.join(root, file)
            comments = extract_comments(filepath)

            for comment in comments:
                if EMOJI_RE.search(comment['text']):
                    violations.append({
                        'file': shorten_path(filepath),
                        'line': comment['line'],
                        'text': comment['text'][:60],
                        'is_test': is_test_file(filepath),
                    })

    return violations


def check_arrow_text(target_dir):
    violations = []

    for root, dirs, files in os.walk(target_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for file in files:
            if not file.endswith('.py'):
                continue

            filepath = os.path.join(root, file)
            comments = extract_comments(filepath)

            for comment in comments:
                for pattern in ARROW_PATTERNS:
                    if pattern.search(comment['text']):
                        violations.append({
                            'file': shorten_path(filepath),
                            'line': comment['line'],
                            'text': comment['text'][:60],
                            'is_test': is_test_file(filepath),
                        })
                        break

    return violations


def main():
    target = '../backend/studyFlax'

    print_header()

    # 1. Banner Comments
    print_section("1", "BANNER COMMENTS")
    banner_violations = check_banner_comments(target)

    if banner_violations:
        print(f"\n{Colors.RED}❌ {len(banner_violations)} VIOLATION(S){Colors.END}\n")
        for v in banner_violations:
            print(f"{Colors.BOLD}{v['file']}:{v['line']}{Colors.END}")
            print(f"  {Colors.RED}{v['text']}{Colors.END}\n")
    else:
        print("\n✅ No banner comments found\n")

    # 2. American Spelling
    print_section("2", "AMERICAN SPELLING IN COMMENTS")
    spelling_violations = check_american_spelling(target)

    if spelling_violations:
        print(f"\n{Colors.RED}❌ {len(spelling_violations)} VIOLATION(S){Colors.END}\n")
        for v in spelling_violations:
            print(f"{Colors.BOLD}{v['file']}:{v['line']}{Colors.END}")
            print(f"  \"{v['american']}\" → {Colors.RED}use \"{v['british']}\"{Colors.END}\n")
    else:
        print("\n✅ No American spellings found in comments\n")

    # 3. Emoji Comments
    print_section("3", "EMOJIS IN COMMENTS")
    emoji_violations = check_emoji_comments(target)

    if emoji_violations:
        print(f"\n{Colors.RED}❌ {len(emoji_violations)} VIOLATION(S){Colors.END}\n")
        for v in emoji_violations:
            print(f"{Colors.BOLD}{v['file']}:{v['line']}{Colors.END}")
            print(f"  {Colors.RED}{v['text']}{Colors.END}\n")
    else:
        print("\n✅ No emojis found in comments\n")

    # 4. Arrow Text
    print_section("4", "ARROW TEXT IN COMMENTS")
    arrow_violations = check_arrow_text(target)

    if arrow_violations:
        print(f"\n{Colors.RED}❌ {len(arrow_violations)} VIOLATION(S){Colors.END}\n")
        for v in arrow_violations:
            print(f"{Colors.BOLD}{v['file']}:{v['line']}{Colors.END}")
            print(f"  {Colors.RED}{v['text']}{Colors.END}\n")
    else:
        print("\n✅ No arrow text found in comments\n")

    # Summary
    print(f"{'─'*75}")
    print(f"{Colors.BOLD}{Colors.YELLOW}SUMMARY{Colors.END}")
    print(f"{'─'*75}\n")

    total = (
        len(banner_violations) +
        len(spelling_violations) +
        len(emoji_violations) +
        len(arrow_violations)
    )

    print(f"Banner Comments:    {'❌' if banner_violations else '✅'} {len(banner_violations)} violation(s)")
    print(f"American Spelling:  {'❌' if spelling_violations else '✅'} {len(spelling_violations)} violation(s)")
    print(f"Emoji Comments:     {'❌' if emoji_violations else '✅'} {len(emoji_violations)} violation(s)")
    print(f"Arrow Text:         {'❌' if arrow_violations else '✅'} {len(arrow_violations)} violation(s)")

    print(f"\n{'='*75}")

    if total == 0:
        print(f"{Colors.YELLOW}🎉 ALL COMMENT RULES MET!{Colors.END}")
    else:
        print(f"{Colors.YELLOW}⚠️  {total} TOTAL VIOLATIONS - FIXES REQUIRED{Colors.END}")

    print(f"{'='*75}\n")

    return 1 if total > 0 else 0

if __name__ == '__main__':
    exit(main())
