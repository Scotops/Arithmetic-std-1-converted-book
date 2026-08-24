"""Replace matrix narration with the single natural Microsoft Guy neural voice."""

import asyncio
import html
import json
import os
import re
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
TEXTS_PATH = ROOT / "content/i18n/en-US/texts.json"
AUDIO_PATH = ROOT / "content/i18n/en-US/audios.json"
AUDIO_DIR = ROOT / "content/i18n/en-US/audio"
VOICE = "en-US-GuyNeural"
SUFFIX = ".matrix-neural-20260824.mp3"

ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
        "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
        "eighteen", "nineteen"]
TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
OVERRIDES = {
    "pg003_n0006": "Roman numeral five.",
    "pg003_n0009": "Roman numeral six.",
    "pg035_n0043": "Eight plus dash equals nine.",
}


def number_words(number: int) -> str:
    if number < 20:
        return ONES[number]
    if number < 100:
        return TENS[number // 10] + ("-" + ONES[number % 10] if number % 10 else "")
    if number < 1000:
        return ONES[number // 100] + " hundred" + (" " + number_words(number % 100) if number % 100 else "")
    return str(number)


def spoken_text(value: str) -> str:
    if value.strip() == "-":
        return "dash"
    value = re.sub(r"<span[^>]*adt-blank-line[^>]*></span>", " dash ", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value).replace("_", " dash ")
    value = re.sub(r"[−–]", " minus ", value)
    value = re.sub(r"-\s*=", " minus dash equals ", value)
    value = re.sub(r"\+\s*=", " plus dash equals ", value)
    value = re.sub(r"(?<=\d)\s*-\s*(?=\d)", " minus ", value)
    value = value.replace("+", " plus ").replace("=", " equals ")
    value = value.replace("÷", " divided by ").replace("×", " multiplied by ")

    def words(match: re.Match[str]) -> str:
        token = match.group(0)
        return number_words(int(token)) if len(token) <= 3 else token

    value = re.sub(r"(?<![A-Za-z])\d+(?![A-Za-z])", words, value)
    return re.sub(r"\s+", " ", value).strip()


async def create_file(identifier: str, text: str, semaphore: asyncio.Semaphore) -> tuple[str, str | None]:
    filename = f"{identifier}{SUFFIX}"
    destination = AUDIO_DIR / filename
    if destination.exists() and destination.stat().st_size > 1024:
        return identifier, filename
    async with semaphore:
        try:
            await asyncio.wait_for(
                edge_tts.Communicate(text, voice=VOICE).save(str(destination)), timeout=12
            )
            return identifier, filename
        except Exception as error:  # Keep the current, working audio on an isolated API failure.
            print(f"Failed {identifier}: {error}")
            return identifier, None


async def main() -> None:
    texts = json.loads(TEXTS_PATH.read_text(encoding="utf-8-sig"))
    audios = json.loads(AUDIO_PATH.read_text(encoding="utf-8-sig"))
    ids = [key for key, value in audios.items() if ".matrix-20260824.wav" in str(value) and texts.get(key, "").strip()]
    # A time-limited generation run can finish files before it gets a chance
    # to write the mappings.  Reuse those complete files on the next run.
    for identifier in list(ids):
        filename = f"{identifier}{SUFFIX}"
        destination = AUDIO_DIR / filename
        if destination.exists() and destination.stat().st_size > 1024:
            audios[identifier] = f"{filename}?matrix-neural-20260824"
    ids = [key for key, value in audios.items() if ".matrix-20260824.wav" in str(value) and texts.get(key, "").strip()]
    AUDIO_PATH.write_text(json.dumps(audios, indent=2) + "\n", encoding="utf-8")
    print(f"Generating {len(ids)} natural single-voice recordings with {VOICE}.")
    batch_size = int(os.environ.get("NEURAL_BATCH_SIZE", "300"))
    batch_offset = int(os.environ.get("NEURAL_BATCH_OFFSET", "0"))
    ids = ids[batch_offset:batch_offset + batch_size]
    print(f"Processing batch starting at {batch_offset}: {len(ids)} recordings.")
    semaphore = asyncio.Semaphore(30)
    tasks = [create_file(identifier, OVERRIDES.get(identifier, spoken_text(texts[identifier])), semaphore)
             for identifier in ids]
    completed = 0
    for future in asyncio.as_completed(tasks):
        identifier, filename = await future
        if filename:
            audios[identifier] = f"{filename}?matrix-neural-20260824"
            completed += 1
        if completed and completed % 100 == 0:
            print(f"Completed {completed}/{len(ids)}")
    AUDIO_PATH.write_text(json.dumps(audios, indent=2) + "\n", encoding="utf-8")
    print(f"Completed {completed}/{len(ids)} natural single-voice recordings in this batch.")


if __name__ == "__main__":
    asyncio.run(main())
