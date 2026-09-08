from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(
    r"C:\Users\ADMIN\.codex\generated_images\01a01e07-e7da-7e41-b8b2-f6e66903f9c6"
    r"\exec-787d9df9-6bda-483f-b4db-45d805d2425e.png"
)
IMPLEMENTATION = ROOT / "qa" / "implementation-desktop-final.png"
OUTPUT = ROOT / "qa" / "comparison-desktop-final.png"
FOCUS_OUTPUT = ROOT / "qa" / "comparison-focus-story-actions-final.png"
TARGET_SIZE = (1440, 1024)
LABEL_HEIGHT = 44


def label_font() -> ImageFont.ImageFont:
    for candidate in ("C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/arial.ttf"):
        try:
            return ImageFont.truetype(candidate, 18)
        except OSError:
            continue
    return ImageFont.load_default()


source = Image.open(SOURCE).convert("RGB").resize(TARGET_SIZE, Image.Resampling.LANCZOS)
implementation = Image.open(IMPLEMENTATION).convert("RGB")
if implementation.size != TARGET_SIZE:
    implementation = implementation.resize(TARGET_SIZE, Image.Resampling.LANCZOS)

canvas = Image.new("RGB", (TARGET_SIZE[0] * 2, TARGET_SIZE[1] + LABEL_HEIGHT), "#eef2ef")
canvas.paste(source, (0, LABEL_HEIGHT))
canvas.paste(implementation, (TARGET_SIZE[0], LABEL_HEIGHT))

draw = ImageDraw.Draw(canvas)
font = label_font()
draw.text((18, 12), "SOURCE — selected Performance Storyboard", fill="#111827", font=font)
draw.text((TARGET_SIZE[0] + 18, 12), "IMPLEMENTATION — local prototype", fill="#111827", font=font)
draw.line((TARGET_SIZE[0], 0, TARGET_SIZE[0], canvas.height), fill="#93a199", width=2)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUTPUT, optimize=True)
print(OUTPUT)

story_box = (290, 285, 1416, 758)
actions_box = (290, 765, 1416, 1005)
story_source = source.crop(story_box)
story_implementation = implementation.crop(story_box)
actions_source = source.crop(actions_box)
actions_implementation = implementation.crop(actions_box)

focus = Image.new(
    "RGB",
    (
        story_source.width * 2,
        LABEL_HEIGHT + story_source.height + LABEL_HEIGHT + actions_source.height,
    ),
    "#eef2ef",
)
focus.paste(story_source, (0, LABEL_HEIGHT))
focus.paste(story_implementation, (story_source.width, LABEL_HEIGHT))
actions_y = LABEL_HEIGHT + story_source.height + LABEL_HEIGHT
focus.paste(actions_source, (0, actions_y))
focus.paste(actions_implementation, (actions_source.width, actions_y))

focus_draw = ImageDraw.Draw(focus)
focus_draw.text((14, 12), "SOURCE — story + evidence", fill="#111827", font=font)
focus_draw.text((story_source.width + 14, 12), "IMPLEMENTATION — story + evidence", fill="#111827", font=font)
focus_draw.text((14, LABEL_HEIGHT + story_source.height + 12), "SOURCE — recommended actions", fill="#111827", font=font)
focus_draw.text(
    (actions_source.width + 14, LABEL_HEIGHT + story_source.height + 12),
    "IMPLEMENTATION — recommended actions",
    fill="#111827",
    font=font,
)
focus_draw.line((story_source.width, 0, story_source.width, focus.height), fill="#93a199", width=2)
focus_draw.line(
    (0, LABEL_HEIGHT + story_source.height, focus.width, LABEL_HEIGHT + story_source.height),
    fill="#93a199",
    width=2,
)
focus.save(FOCUS_OUTPUT, optimize=True)
print(FOCUS_OUTPUT)
