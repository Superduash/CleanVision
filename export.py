#!/usr/bin/env python3
"""
CleanVision — Source Code Exporter
===================================
Scans the repository and bundles every tracked source file into a single
human-readable text file that is ideal for sharing with AI models.

Usage:
    python export.py

Output:
    Complete_Project_Code.txt  (in the repository root)

Excluded automatically:
    - node_modules/
    - frontend/build/
    - __pycache__/ and *.pyc / *.pyo
    - backend/uploads/ (binary image files)
    - backend/database.db
    - backend/cleanliness_model.h5
    - .git/
    - .env files
    - Binary files (images, archives, fonts, etc.)
    - The output file itself
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).parent.resolve()
OUTPUT_FILE = REPO_ROOT / "Complete_Project_Code.txt"

# Directories to skip entirely (relative to repo root, or basename)
SKIP_DIRS: set[str] = {
    ".git",
    "node_modules",
    "__pycache__",
    "build",           # frontend/build
    ".venv",
    "venv",
    "env",
    ".env",
    "dist",
    ".idea",
    ".vscode",
    "uploads",         # binary images
    "content",         # colab downloads
}

# File patterns / exact names to skip
SKIP_FILES: set[str] = {
    "database.db",
    "cleanliness_model.h5",
    "package-lock.json",
    "Complete_Project_Code.txt",
}

# File extensions to skip (binary / generated)
SKIP_EXTENSIONS: set[str] = {
    ".pyc", ".pyo", ".pyd",
    ".db", ".sqlite", ".sqlite3",
    ".h5", ".pb", ".tflite",
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".ico", ".svg",
    ".mp4", ".avi", ".mov",
    ".zip", ".tar", ".gz", ".rar",
    ".exe", ".dll", ".so", ".dylib",
    ".woff", ".woff2", ".ttf", ".eot",
    ".map",           # source maps
    ".lock",          # lock files
}

# Extensions we treat as source (always include if not skipped above)
SOURCE_EXTENSIONS: set[str] = {
    ".py", ".js", ".jsx", ".ts", ".tsx",
    ".css", ".html", ".json", ".md", ".txt",
    ".env.example", ".gitignore",
    ".toml", ".yaml", ".yml",
    ".ipynb",
    "",               # extensionless files (Procfile, etc.)
}

SEPARATOR = "=" * 72


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def should_skip_dir(dir_path: Path) -> bool:
    """Return True if this directory should be skipped entirely."""
    for part in dir_path.relative_to(REPO_ROOT).parts:
        if part in SKIP_DIRS:
            return True
    return False


def should_skip_file(file_path: Path) -> bool:
    """Return True if this file should be excluded from the export."""
    if file_path.name in SKIP_FILES:
        return True
    ext = file_path.suffix.lower()
    if ext in SKIP_EXTENSIONS:
        return True
    # Skip hidden files (e.g. .DS_Store, .gitkeep is ok though)
    if file_path.name.startswith(".") and file_path.name not in {
        ".gitignore", ".env.example", ".gitkeep"
    }:
        return True
    return False


def is_text_file(file_path: Path) -> bool:
    """Return True if the file appears to be text (not binary)."""
    try:
        with open(file_path, "rb") as f:
            chunk = f.read(8192)
        # If there are null bytes, it's binary
        return b"\x00" not in chunk
    except OSError:
        return False


def collect_files(root: Path) -> list[Path]:
    """Walk the repo and collect all source files in sorted order."""
    collected: list[Path] = []

    for dirpath, dirnames, filenames in os.walk(root):
        dir_path = Path(dirpath)

        # Prune skipped directories (modify in-place to prevent descending)
        dirnames[:] = sorted(
            d for d in dirnames
            if not should_skip_dir(dir_path / d)
        )

        for filename in sorted(filenames):
            file_path = dir_path / filename
            if should_skip_file(file_path):
                continue
            if not is_text_file(file_path):
                continue
            collected.append(file_path)

    return collected


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print(f"CleanVision Source Exporter")
    print(f"Scanning: {REPO_ROOT}")
    print(f"Output:   {OUTPUT_FILE}\n")

    files = collect_files(REPO_ROOT)

    if not files:
        print("No source files found. Exiting.")
        sys.exit(1)

    exported = 0
    skipped  = 0

    with open(OUTPUT_FILE, "w", encoding="utf-8", errors="replace") as out:
        out.write("CleanVision — Complete Source Code Export\n")
        out.write(f"Repository: {REPO_ROOT}\n")
        out.write(f"Files exported: {len(files)}\n")
        out.write(SEPARATOR + "\n\n")

        for file_path in files:
            rel = file_path.relative_to(REPO_ROOT)
            try:
                content = file_path.read_text(encoding="utf-8", errors="replace")
            except OSError as exc:
                print(f"  SKIP (read error): {rel}  — {exc}")
                skipped += 1
                continue

            out.write(f"\n{SEPARATOR}\n")
            out.write(f"FILE: {rel.as_posix()}\n")
            out.write(f"{SEPARATOR}\n\n")
            out.write(content)
            if not content.endswith("\n"):
                out.write("\n")

            print(f"  + {rel}")
            exported += 1

        out.write(f"\n{SEPARATOR}\n")
        out.write(f"END OF EXPORT — {exported} files\n")
        out.write(SEPARATOR + "\n")

    print(f"\nDone! Exported {exported} files -> {OUTPUT_FILE}")
    if skipped:
        print(f"  ({skipped} file(s) skipped due to read errors)")
    print(f"  File size: {OUTPUT_FILE.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
