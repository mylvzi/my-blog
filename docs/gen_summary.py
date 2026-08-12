#!/usr/bin/env python3
"""Regenerate SUMMARY.md from this GitBook content tree.

Every content directory needs a README.md; every document needs a first H1.
The top-level navigation order is intentional and mirrors the site structure.
"""

from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent
SECTIONS = ["tech", "reading", "life", "musing", "about", "projects"]
IGNORED = {".git", ".gitbook", ".legacy", ".trash", "node_modules", "public"}


def page_title(path: Path) -> str:
    for line in path.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^#\s+(.+?)\s*$", line)
        if match:
            return match.group(1)
    raise ValueError(f"Missing H1 title: {path.relative_to(ROOT)}")


def ordered_children(directory: Path) -> list[Path]:
    """Keep the hand-authored navigation order when SUMMARY.md already exists."""
    summary = ROOT / "SUMMARY.md"
    if not summary.exists():
        return sorted(directory.iterdir())

    order: dict[Path, int] = {}
    descendants: dict[Path, int] = {}
    for index, target in enumerate(re.findall(r"\]\(([^)]+\.md)\)", summary.read_text(encoding="utf-8"))):
        page = (ROOT / target).resolve()
        parent = page.parent
        if parent == directory.resolve():
            order[page] = index
        try:
            page.relative_to(directory.resolve())
        except ValueError:
            continue
        for child in directory.iterdir():
            candidate = (child / "README.md").resolve() if child.is_dir() else child.resolve()
            try:
                page.relative_to(child.resolve())
            except ValueError:
                continue
            descendants[candidate] = min(descendants.get(candidate, index), index)

    def key(item: Path) -> tuple[int, str]:
        page = (item / "README.md").resolve() if item.is_dir() else item.resolve()
        return (order.get(page, descendants.get(page, 10_000)), item.name)

    return sorted(directory.iterdir(), key=key)


def emit(path: Path, depth: int, lines: list[str], visited: set[Path]) -> None:
    path = path.resolve()
    if path in visited:
        return
    visited.add(path)
    rel = path.relative_to(ROOT).as_posix()
    lines.append(f"{'  ' * depth}* [{page_title(path)}]({rel})")
    directory = path.parent
    children = [
        child
        for child in ordered_children(directory)
        if child.suffix == ".md" and child.name != "README.md"
    ]
    for child in children:
        child = child.resolve()
        if child not in visited:
            visited.add(child)
            rel = child.relative_to(ROOT).as_posix()
            lines.append(f"{'  ' * (depth + 1)}* [{page_title(child)}]({rel})")
    directories = [
        child
        for child in ordered_children(directory)
        if child.is_dir() and child.name not in IGNORED and (child / "README.md").exists()
    ]
    for child in directories:
        emit(child / "README.md", depth + 1, lines, visited)


def main() -> None:
    lines = ["# Table of contents", ""]
    lines.append(f"* [{page_title(ROOT / 'README.md')}](README.md)")
    visited: set[Path] = {(ROOT / "README.md").resolve()}
    for section in SECTIONS:
        readme = ROOT / section / "README.md"
        if readme.exists():
            emit(readme, 0, lines, visited)
    (ROOT / "SUMMARY.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
