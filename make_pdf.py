"""Generate developers-manual.pdf from the .tex content using reportlab."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
from reportlab.platypus import Flowable
import os

# ── Paths ──────────────────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(BASE, "report", "resources", "pdf", "Kcl-logo.pdf")
OUT  = os.path.join(BASE, "developers-manual.pdf")

# ── Colours ────────────────────────────────────────────────────────────────
KCL_RED   = colors.HexColor("#8B0000")
CODE_BG   = colors.HexColor("#F4F4F4")
RULE_COL  = colors.HexColor("#CCCCCC")
HEADER_BG = colors.HexColor("#2C2C2C")

W, H = A4
ML = MR = 2.5 * cm
MT = MB = 2.5 * cm

# ── Styles ─────────────────────────────────────────────────────────────────
base_styles = getSampleStyleSheet()

def S(name, **kw):
    s = ParagraphStyle(name, **kw)
    return s

normal     = S("NormalX",   fontName="Helvetica",       fontSize=10.5, leading=15, spaceAfter=6)
justified  = S("Justified", fontName="Helvetica",       fontSize=10.5, leading=15, spaceAfter=6, alignment=TA_JUSTIFY)
h1         = S("H1",        fontName="Helvetica-Bold",  fontSize=16,   leading=20, spaceBefore=18, spaceAfter=8,  textColor=KCL_RED)
h2         = S("H2",        fontName="Helvetica-Bold",  fontSize=13,   leading=17, spaceBefore=12, spaceAfter=6)
h3         = S("H3",        fontName="Helvetica-BoldOblique", fontSize=11, leading=15, spaceBefore=8, spaceAfter=4)
code_style = S("Code",      fontName="Courier",         fontSize=9,    leading=13, spaceAfter=4, backColor=CODE_BG, leftIndent=8, rightIndent=8)
bullet_s   = S("BulletX",   fontName="Helvetica",       fontSize=10.5, leading=15, spaceAfter=4,  leftIndent=16, bulletIndent=6)
item_s     = S("ItemX",     fontName="Helvetica",       fontSize=10.5, leading=15, spaceAfter=4,  leftIndent=24, bulletIndent=6)
toc_ch     = S("TocCh",     fontName="Helvetica-Bold",  fontSize=11,   leading=14, spaceAfter=2)
toc_sec    = S("TocSec",    fontName="Helvetica",       fontSize=10,   leading=13, spaceAfter=1,  leftIndent=16)
title_s    = S("TitleS",    fontName="Helvetica-Bold",  fontSize=26,   leading=30, spaceAfter=10, textColor=KCL_RED, alignment=TA_CENTER)
subtitle_s = S("SubtitleS", fontName="Helvetica-Oblique", fontSize=15, leading=19, spaceAfter=8, alignment=TA_CENTER)
meta_s     = S("MetaS",     fontName="Helvetica",       fontSize=11,   leading=15, spaceAfter=4,  alignment=TA_CENTER)
url_s      = S("UrlS",      fontName="Courier",         fontSize=9.5,  leading=13, textColor=colors.blue, spaceAfter=4)
label_s    = S("LabelS",    fontName="Helvetica-Bold",  fontSize=10.5, leading=15, spaceAfter=2)
desc_s     = S("DescS",     fontName="Helvetica",       fontSize=10.5, leading=15, spaceAfter=4, leftIndent=16)
center_s   = S("CenterS",   fontName="Helvetica",       fontSize=10.5, leading=15, spaceAfter=4, alignment=TA_CENTER)

# ── Helpers ────────────────────────────────────────────────────────────────
def rule():
    return HRFlowable(width="100%", thickness=0.5, color=RULE_COL, spaceAfter=6, spaceBefore=6)

def sp(n=8):
    return Spacer(1, n)

def chapter(num, title_text):
    return [
        Paragraph(f"Chapter {num}: {title_text}", h1),
        rule(),
    ]

def section(title_text):
    return Paragraph(title_text, h2)

def para(text):
    return Paragraph(text, justified)

def code_block(lines):
    blocks = []
    for line in lines:
        # escape XML special chars
        safe = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        blocks.append(Paragraph(safe if safe.strip() else "&nbsp;", code_style))
    return blocks

def bullet(text):
    return Paragraph(f"\u2022 &nbsp; {text}", bullet_s)

def numbered(n, text):
    return Paragraph(f"{n}. &nbsp; {text}", item_s)

def url(text):
    return Paragraph(f'<font color="blue"><u>{text}</u></font>', url_s)

def bold(text):
    return f"<b>{text}</b>"

def tt(text):
    return f'<font face="Courier">{text}</font>'

def table_style_base():
    return [
        ("BACKGROUND",   (0, 0), (-1, 0),  HEADER_BG),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, -1), 9),
        ("LEADING",      (0, 0), (-1, -1), 13),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9F9F9")]),
        ("GRID",         (0, 0), (-1, -1), 0.4, RULE_COL),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]

# ── Logo helper ────────────────────────────────────────────────────────────
def logo_flowable():
    try:
        from reportlab.platypus import Image as RLImage
        from reportlab.lib.utils import ImageReader
        # Try to use pypdf to render the logo PDF as an image
        import subprocess, tempfile
        # Use sips (macOS) to convert PDF page to PNG
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        tmp.close()
        result = subprocess.run(
            ["sips", "-s", "format", "png", LOGO, "--out", tmp.name],
            capture_output=True
        )
        if result.returncode == 0 and os.path.exists(tmp.name):
            img = RLImage(tmp.name, width=4*cm, height=4*cm, kind="proportional")
            return img
    except Exception:
        pass
    return Spacer(1, 0)

# ── Page numbering ─────────────────────────────────────────────────────────
def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.grey)
    page_num = canvas.getPageNumber()
    if page_num > 2:  # skip title + TOC pages
        canvas.drawCentredString(W / 2, 1.5 * cm, f"— {page_num} —")
    canvas.restoreState()

# ── BUILD ──────────────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=ML, rightMargin=MR,
        topMargin=MT,  bottomMargin=MB,
        title="Developer's Manual – StudyFlax",
        author="Team Flax-10",
    )

    story = []

    # ── Title Page ──────────────────────────────────────────────────────
    story.append(Spacer(1, 2 * cm))
    logo = logo_flowable()
    story.append(logo)
    story.append(Spacer(1, 1 * cm))
    story.append(Paragraph("Developer's Manual", title_s))
    story.append(Paragraph("StudyFlax: Time Management for Higher Education", subtitle_s))
    story.append(sp(20))
    story.append(HRFlowable(width="60%", thickness=1, color=KCL_RED, hAlign="CENTER"))
    story.append(sp(16))
    story.append(Paragraph("Faculty of Natural, Mathematical, and Engineering Sciences", meta_s))
    story.append(Paragraph("Department of Informatics", meta_s))
    story.append(sp(20))
    story.append(Paragraph("<b>Team Flax-10</b>", meta_s))
    for name in [
        "Aishah Ahmed", "Eric Almeida", "Zerun (Harry) Chen",
        "Cate Tay (Cate) Chew", "Indixora Jozal", "Kausar Khan",
        "Hamed Latif", "Dian Mahmood", "Binuli Nevanma Markawitage",
    ]:
        story.append(Paragraph(name, meta_s))
    story.append(sp(20))
    story.append(Paragraph("March 2026", meta_s))
    story.append(PageBreak())

    # ── Table of Contents ───────────────────────────────────────────────
    story.append(Paragraph("Table of Contents", h1))
    story.append(rule())
    toc_entries = [
        ("1.", "Overview"),
        ("2.", "Prerequisites"),
        ("3.", "Cloning the Repository"),
        ("4.", "Setting Up the Development Environment with Nix"),
        ("",   "  4.1  Linux and macOS"),
        ("",   "  4.2  Re-entering the Nix Shell in Future Sessions"),
        ("5.", "Database Setup"),
        ("",   "  5.1  Automated Setup via Nix (Recommended)"),
        ("",   "  5.2  Manual PostgreSQL Setup"),
        ("6.", "Running the Application"),
        ("",   "  6.1  Backend (Django)"),
        ("",   "  6.2  Frontend (React / Vite)"),
        ("7.", "Running the Tests"),
        ("",   "  7.1  Backend Tests and Coverage"),
        ("",   "  7.2  Frontend Tests and Coverage"),
        ("8.", "User Fixtures and Access Credentials"),
        ("9.", "Deployed System"),
        ("10.", "Troubleshooting"),
        ("11.", "Package Summary"),
        ("",    "  11.1 Backend"),
        ("",    "  11.2 Frontend"),
        ("",    "  11.3 Package Management"),
    ]
    for num, title_text in toc_entries:
        style = toc_ch if num.strip() else toc_sec
        story.append(Paragraph(f"{num}&nbsp;&nbsp;{title_text.strip()}", style))
    story.append(PageBreak())

    # ── Chapter 1: Overview ─────────────────────────────────────────────
    story.extend(chapter(1, "Overview"))
    story.append(para(
        "StudyFlax is a web-based academic time management platform built for "
        "students and teachers at King's College London. It allows students to "
        "organise their schedules, track deadlines, and manage their academic "
        "workload in one place. Teachers can create modules, set deadlines, and "
        "assign work to their students, whilst the admin oversees and manages "
        "the system as a whole."
    ))
    story.append(sp())
    story.append(para("The system consists of two software components:"))
    story.append(bullet(f"{bold('Backend')} — A Django (Python 3.14) REST API backed by a PostgreSQL database."))
    story.append(bullet(f"{bold('Frontend')} — A React (Vite) single-page application."))
    story.append(sp())
    story.append(para("The deployed application is available at:"))
    story.append(url("https://flax-10-production.up.railway.app/"))

    # ── Chapter 2: Prerequisites ────────────────────────────────────────
    story.extend(chapter(2, "Prerequisites"))
    story.append(para(
        "The following tools must be installed before setting up the development "
        "environment. Installation of the operating system itself is assumed."
    ))
    prereqs = [
        ("Nix Package Manager (v2.33.2 or later)", "https://nixos.org/download/#download-nix"),
        ("Git", "https://git-scm.com/downloads"),
        ("PostgreSQL (only required for manual setup without Nix)", "https://www.postgresql.org/download/"),
    ]
    for tool, link in prereqs:
        story.append(bullet(f"{bold(tool)}"))
        story.append(Paragraph(f'&nbsp;&nbsp;&nbsp;&nbsp;<font color="blue"><u>{link}</u></font>', url_s))

    # ── Chapter 3: Cloning the Repository ──────────────────────────────
    story.extend(chapter(3, "Cloning the Repository"))
    story.append(para("Clone the repository and navigate into it:"))
    story.extend(code_block([
        "git clone https://github.com/hoxtl/Flax-10.git",
        "cd Flax-10",
    ]))

    # ── Chapter 4: Nix Setup ────────────────────────────────────────────
    story.extend(chapter(4, "Setting Up the Development Environment with Nix"))
    story.append(para(
        "This project uses a Nix flake to automate the full development "
        "environment setup. Upon entering the Nix shell, the following steps "
        "are performed automatically:"
    ))
    auto_steps = [
        "A Python 3.14 virtual environment is created and activated.",
        f"All Python dependencies are installed from {tt('requirements.txt')}.",
        "All Node.js (v20) dependencies are installed via npm.",
        f"Django database migrations are applied ({tt('makemigrations')} and {tt('migrate')}).",
        "The database is seeded with fixture and generated data.",
        f"The Django development server is started on {tt('http://localhost:8000')}.",
        "The Vite frontend development server is started.",
        "Backend and frontend coverage reports are generated.",
    ]
    for s in auto_steps:
        story.append(bullet(s))

    story.append(sp(10))
    story.append(section("4.1  Linux and macOS"))
    steps_linux = [
        (f"Navigate to the root of the repository:", ["cd /path/to/Flax-10"]),
        ("Enter the Nix development shell:", ["nix --extra-experimental-features 'nix-command flakes' develop -c bash"]),
        (
            f"{bold('Optional — enable experimental features permanently.')} "
            f"Add the following line to {tt('/etc/nix/nix.conf')} to avoid passing the flags on every invocation:",
            ["experimental-features = nix-command flakes"]
        ),
        (
            "On first run, the flake creates the virtual environment and installs all dependencies. "
            "On subsequent runs, it detects the existing environment and activates it. "
            f"You will be returned to a {tt('bash')} terminal once setup is complete.",
            []
        ),
    ]
    for i, (desc, cmd) in enumerate(steps_linux, 1):
        story.append(numbered(i, desc))
        if cmd:
            story.extend(code_block(cmd))

    story.append(sp(10))
    story.append(section("4.2  Re-entering the Nix Shell in Future Sessions"))
    story.append(para("Each time you wish to return to the development environment, run the following from the root of the repository:"))
    story.extend(code_block(["nix --extra-experimental-features 'nix-command flakes' develop -c bash"]))

    # ── Chapter 5: Database Setup ───────────────────────────────────────
    story.extend(chapter(5, "Database Setup"))
    story.append(section("5.1  Automated Setup via Nix (Recommended)"))
    story.append(para(
        f"The Nix shell hook runs {tt('makemigrations')}, {tt('migrate')}, and "
        f"{tt('seed')} automatically on entry. No manual database configuration "
        "is required when using Nix."
    ))
    story.append(sp(8))
    story.append(section("5.2  Manual PostgreSQL Setup"))
    story.append(para("If you are setting up the project without Nix:"))
    manual_steps = [
        (f"Install PostgreSQL and open the {tt('psql')} terminal.", []),
        ("Accept all default connection parameters (server, database, port) by pressing Enter at each prompt.", []),
        (f"When prompted for a password, enter {tt('1234')} — this is the default value expected by {tt('settings.py')}.", []),
        (
            f"Apply migrations and seed the database from within {tt('flax-10-project-files/backend')}:",
            ["python manage.py makemigrations", "python manage.py migrate", "python manage.py seed"]
        ),
    ]
    for i, (desc, cmd) in enumerate(manual_steps, 1):
        story.append(numbered(i, desc))
        if cmd:
            story.extend(code_block(cmd))
    story.append(sp(6))
    story.append(para(
        f"{bold('Note:')} If you choose a different PostgreSQL password, update the "
        f"{tt('PASSWORD')} field in {tt('settings.py')} accordingly."
    ))

    # ── Chapter 6: Running the Application ─────────────────────────────
    story.extend(chapter(6, "Running the Application"))
    story.append(section("6.1  Backend (Django)"))
    story.append(para(f"From within {tt('flax-10-project-files/backend')}:"))
    story.extend(code_block(["python manage.py runserver"]))
    story.append(para(f"The API will be available at {tt('http://localhost:8000')}."))
    story.append(sp(8))
    story.append(section("6.2  Frontend (React / Vite)"))
    story.append(para(f"From within {tt('flax-10-project-files/frontend')}:"))
    story.extend(code_block(["npm run dev"]))
    story.append(para(
        f"The frontend will be available at {tt('http://localhost:5173')} "
        "(or the port shown in the Vite terminal output)."
    ))
    story.append(sp(6))
    story.append(para(
        f"{bold('Note:')} When using the Nix shell, both servers are started automatically in the background."
    ))

    # ── Chapter 7: Running the Tests ────────────────────────────────────
    story.extend(chapter(7, "Running the Tests"))
    story.append(section("7.1  Backend Tests and Coverage"))
    story.append(para(f"From within {tt('flax-10-project-files/backend')}:"))
    story.extend(code_block([
        "python -m coverage erase",
        "python -m coverage run manage.py test",
        "python -m coverage report -m",
        "python -m coverage html",
    ]))
    story.append(para(
        f"The HTML coverage report is generated at "
        f"{tt('flax-10-project-files/backend/htmlcov/index.html')}."
    ))
    story.append(para(f"{bold('Note:')} The Nix shell runs these commands automatically on entry."))
    story.append(sp(8))
    story.append(section("7.2  Frontend Tests and Coverage"))
    story.append(para(f"From within {tt('flax-10-project-files/frontend')}:"))
    story.extend(code_block(["npm run test -- --run", "npm run coverage"]))

    # ── Chapter 8: User Fixtures ─────────────────────────────────────────
    story.extend(chapter(8, "User Fixtures and Access Credentials"))
    story.append(para(
        "The following fixture accounts are available after seeding the database. "
        f"All passwords are {tt('1234')}."
    ))
    story.append(sp(6))
    data = [
        ["Username", "Role", "Password"],
        ["johndoe",  "Student / Admin", "1234"],
        ["janedoe",  "Student",         "1234"],
        ["amiller",  "Teacher",         "1234"],
        ["charlie",  "Student",         "1234"],
    ]
    t = Table(data, colWidths=[5*cm, 7*cm, 4*cm])
    t.setStyle(TableStyle(table_style_base()))
    story.append(t)
    story.append(sp(8))
    story.append(para("Additional users are seeded automatically using Faker."))
    story.append(sp(6))
    story.append(para(f"{bold('Django admin panel:')} {tt('http://localhost:8000/admin/')}"))
    story.append(para(
        f"Signing in as {tt('johndoe')} with password {tt('1234')} also grants "
        "access to admin features through the main application interface."
    ))

    # ── Chapter 9: Deployed System ──────────────────────────────────────
    story.extend(chapter(9, "Deployed System"))
    story.append(para("The production deployment is hosted on Railway:"))
    story.append(Paragraph(
        '<para align="center"><font color="blue"><u>https://flax-10-production.up.railway.app/</u></font></para>',
        center_s
    ))

    # ── Chapter 10: Troubleshooting ─────────────────────────────────────
    story.extend(chapter(10, "Troubleshooting"))
    issues = [
        (
            "Nix experimental features error.",
            f"If you encounter an error relating to {tt('nix-command')} or {tt('flakes')}, "
            f"ensure the flags are passed as shown in Chapter 4, or add them permanently to {tt('/etc/nix/nix.conf')}."
        ),
        (
            "Database connection error.",
            f"Verify that your PostgreSQL server is running and that the password "
            f"in {tt('settings.py')} matches your local PostgreSQL password (default: {tt('1234')})."
        ),
        (
            "Port already in use.",
            f"If {tt('localhost:8000')} or {tt('localhost:5173')} is already occupied, "
            "terminate the conflicting process or start the server on an alternative port:"
        ),
        (
            "Coverage module not found.",
            f"Ensure {tt('coverage')} is installed in the virtual environment:"
        ),
        (
            "Re-seeding inflates data.",
            f"The Nix shell runs {tt('python manage.py seed')} on every entry, which may "
            "duplicate seeded data. To reset the database to a clean state, run the following "
            f"from within {tt('flax-10-project-files/backend')}:"
        ),
    ]
    port_cmd   = ["python manage.py runserver 8080"]
    cov_cmd    = ["pip install coverage"]
    flush_cmd  = ["python manage.py flush --no-input", "python manage.py migrate", "python manage.py seed"]

    for i, (label, desc) in enumerate(issues):
        story.append(KeepTogether([
            Paragraph(f"<b>{label}</b>", label_s),
            Paragraph(desc, desc_s),
        ]))
        if i == 2:
            story.extend(code_block(port_cmd))
        elif i == 3:
            story.extend(code_block(cov_cmd))
        elif i == 5:
            story.extend(code_block(flush_cmd))
        story.append(sp(4))

    # ── Chapter 11: Package Summary ──────────────────────────────────────
    story.extend(chapter(11, "Package Summary"))

    story.append(section("11.1  Backend"))
    backend_pkgs = [
        ["Package",             "Version", "Purpose"],
        ["Django",              "5.2.0",   "Web framework"],
        ["djangorestframework", "3.16.1",  "REST API framework"],
        ["psycopg",             "3.3.2",   "PostgreSQL driver"],
        ["psycopg-binary",      "3.3.2",   "Precompiled psycopg binaries"],
        ["faker",               "40.4.0",  "Fake data generation for seeding"],
        ["python-dotenv",       "1.2.1",   "Environment variable management"],
        ["openai",              "2.21.0",  "OpenAI API integration"],
        ["requests",            "2.32.5",  "HTTP client library"],
        ["coverage",            "latest",  "Test coverage reporting"],
    ]
    tw = W - ML - MR
    t2 = Table(backend_pkgs, colWidths=[tw*0.35, tw*0.2, tw*0.45])
    t2.setStyle(TableStyle(table_style_base()))
    story.append(t2)
    story.append(sp(12))

    story.append(section("11.2  Frontend"))
    frontend_pkgs = [
        ["Package",         "Version", "Purpose"],
        ["react",           "19.2.0",  "UI library"],
        ["react-dom",       "19.2.0",  "React DOM renderer"],
        ["vite",            "7.2.4",   "Build tool and dev server"],
        ["framer-motion",   "12.34.0", "Animation library"],
        ["canvas-confetti", "1.9.4",   "Confetti animation"],
        ["eslint",          "9.39.1",  "JavaScript linter"],
    ]
    t3 = Table(frontend_pkgs, colWidths=[tw*0.35, tw*0.2, tw*0.45])
    t3.setStyle(TableStyle(table_style_base()))
    story.append(t3)
    story.append(sp(12))

    story.append(section("11.3  Package Management"))
    mgmt_pkgs = [
        ["Tool", "Version", "Purpose"],
        ["Nix",  "2.33.2",  "Environment package management"],
        ["npm",  "10.8.2",  "JavaScript package management"],
    ]
    t4 = Table(mgmt_pkgs, colWidths=[tw*0.2, tw*0.2, tw*0.6])
    t4.setStyle(TableStyle(table_style_base()))
    story.append(t4)

    # ── Build ────────────────────────────────────────────────────────────
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"PDF written to: {OUT}")

if __name__ == "__main__":
    build()
