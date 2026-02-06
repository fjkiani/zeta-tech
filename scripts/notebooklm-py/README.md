# notebooklm-py – Google NotebookLM API for High School

Programmatic access to Google NotebookLM for content generation, research, and automation.

## Features

- **Content generation**: Audio overviews, video, slide decks, quizzes, flashcards, infographics, mind maps, data tables
- **Batch downloads** of all artifacts
- **Export formats**: JSON, Markdown, HTML (quiz/flashcards); JSON (mind maps); CSV (data tables)
- **Research agents**: Web + Drive research with auto-import
- **Sharing**: Public links and user permissions via API
- **CLI + Python API** for scripts and automation
- **Claude Code skills** for natural-language automation

Source: [github.com/teng-lin/notebooklm-py](https://github.com/teng-lin/notebooklm-py)

---

## Setup

### 1. Activate the virtual environment

```bash
cd /Users/fahadkiani/Desktop/development/High-School
source .venv-notebooklm/bin/activate
```

Or use the wrapper script:

```bash
./scripts/notebooklm-py/notebooklm.sh login
```

### 2. Authenticate (one-time)

```bash
notebooklm login
```

A browser opens for Google sign-in. Credentials are stored in `~/.notebooklm/storage_state.json`.

### 3. Verify

```bash
notebooklm list
```

---

## Quick Usage (CLI)

```bash
# Create notebook and add sources
notebooklm create "High School Research"
notebooklm use <notebook_id>
notebooklm source add "https://en.wikipedia.org/wiki/..."
notebooklm source add "./Bronx-HS-Medical-Science/syllabus.pdf"

# Chat
notebooklm ask "What are the key themes?"

# Generate content
notebooklm generate audio "make it engaging" --wait
notebooklm generate quiz --difficulty hard
notebooklm generate flashcards --quantity more
notebooklm generate slide-deck
notebooklm generate mind-map
notebooklm generate data-table "compare key concepts"

# Download
notebooklm download audio ./podcast.mp3
notebooklm download quiz --format markdown ./quiz.md
notebooklm download flashcards --format json ./cards.json
```

---

## Python API

```python
import asyncio
from notebooklm import NotebookLMClient

async def main():
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create("Research")
        await client.sources.add_url(nb.id, "https://example.com", wait=True)
        result = await client.chat.ask(nb.id, "Summarize this")
        print(result.answer)
        # Generate and download
        status = await client.artifacts.generate_audio(nb.id, instructions="make it fun")
        await client.artifacts.wait_for_completion(nb.id, status.task_id)
        await client.artifacts.download_audio(nb.id, "podcast.mp3")

asyncio.run(main())
```

---

## Claude Code Skills

```bash
notebooklm skill install
```

Then use natural language in Claude Code: *"Create a podcast about quantum computing"*, *"Download the quiz as markdown"*.

---

## Requirements

- Python 3.10+
- Google account
- Storage: `~/.notebooklm/storage_state.json` (created by `login`)
