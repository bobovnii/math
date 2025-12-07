#!/usr/bin/env python3
"""
Inline shared quiz template assets into exercise HTML files and mirror them
into /Users/bobovnii/Documents/business/HTML with the same relative paths.

Usage:
  python unwrap_templates.py \
    --input /Users/bobovnii/Documents/business/math/de/Fifth/Math \
    --output-root /Users/bobovnii/Documents/business/HTML
"""

from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path
from typing import Dict, Iterable, Set


CSS_LINK_RE = re.compile(
    r"<link[^>]+href=['\"]([^'\"]*template_[^'\"]+\.css)['\"][^>]*>",
    re.IGNORECASE | re.DOTALL,
)
SCRIPT_SRC_RE = re.compile(
    r"<script[^>]+src=['\"]([^'\"]*template_[^'\"]+\.js)['\"][^>]*>\s*</script>",
    re.IGNORECASE | re.DOTALL,
)


def load_template_assets(template_dir: Path) -> Dict[str, str]:
    assets: Dict[str, str] = {}
    if not template_dir.exists():
        raise FileNotFoundError(f"Template directory not found: {template_dir}")

    for path in template_dir.glob("template_*.*"):
        if path.is_file():
            assets[path.name] = path.read_text(encoding="utf-8")
    return assets


def inline_assets(
    html_text: str, assets: Dict[str, str], missing: Set[str]
) -> str:
    def replace_css(match: re.Match) -> str:
        name = Path(match.group(1)).name
        css = assets.get(name)
        if css is None:
            missing.add(name)
            return match.group(0)
        return f"<style>\n{css}\n</style>"

    def replace_js(match: re.Match) -> str:
        name = Path(match.group(1)).name
        js = assets.get(name)
        if js is None:
            missing.add(name)
            return match.group(0)
        return f"<script>\n{js}\n</script>"

    html_text = CSS_LINK_RE.sub(replace_css, html_text)
    html_text = SCRIPT_SRC_RE.sub(replace_js, html_text)
    return html_text


def mirror_tree_with_inline_html(
    input_root: Path,
    output_root: Path,
    template_dir: Path,
    rel_base: Path,
    copy_non_html: bool,
) -> None:
    assets = load_template_assets(template_dir)
    missing_refs: Set[str] = set()

    processed = skipped = 0

    for src in input_root.rglob("*"):
        if src.is_dir():
            continue

        rel_path = src.relative_to(rel_base)
        dest = output_root / rel_path
        dest.parent.mkdir(parents=True, exist_ok=True)

        if src.suffix.lower() == ".html":
            html = src.read_text(encoding="utf-8")
            if not (CSS_LINK_RE.search(html) or SCRIPT_SRC_RE.search(html)):
                skipped += 1
                continue
            new_html = inline_assets(html, assets, missing_refs)
            dest.write_text(new_html, encoding="utf-8")
            processed += 1
        elif copy_non_html:
            shutil.copy2(src, dest)

    print(f"[INFO] HTML files processed: {processed}; skipped (no templates): {skipped}")

    if missing_refs:
        missing_list = ", ".join(sorted(missing_refs))
        print(f"[WARN] Missing template assets referenced: {missing_list}")
    else:
        print("[OK] All referenced template assets were inlined.")


def parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Inline shared quiz templates into HTML exercises."
    )
    parser.add_argument(
        "--input",
        "-i",
        required=True,
        type=Path,
        help="Root folder containing exercise HTML files.",
    )
    parser.add_argument(
        "--output-root",
        "-o",
        type=Path,
        default=Path("/Users/bobovnii/Documents/business/HTML"),
        help="Destination root for the flattened HTML tree.",
    )
    parser.add_argument(
        "--template-dir",
        "-t",
        type=Path,
        default=Path(__file__).resolve().parent / "templates",
        help="Directory that stores shared template CSS/JS files.",
    )
    parser.add_argument(
        "--rel-base",
        type=Path,
        help="Optional base path to preserve in the mirrored output (defaults to the input folder).",
    )
    parser.add_argument(
        "--copy-non-html",
        action="store_true",
        help="Also copy non-HTML files to the output (default: do not copy extras).",
    )
    return parser.parse_args(argv)


def main(argv: Iterable[str] | None = None) -> None:
    args = parse_args(argv)
    input_root = args.input.resolve()
    output_root = args.output_root.resolve()
    template_dir = args.template_dir.resolve()

    if not input_root.exists():
        raise FileNotFoundError(f"Input folder not found: {input_root}")

    # Default: mirror relative to the provided input folder.
    rel_base = args.rel_base.resolve() if args.rel_base else input_root

    output_root.mkdir(parents=True, exist_ok=True)
    mirror_tree_with_inline_html(
        input_root=input_root,
        output_root=output_root,
        template_dir=template_dir,
        rel_base=rel_base,
        copy_non_html=args.copy_non_html,
    )
    print(f"[DONE] Created flattened HTML tree under: {output_root}")


if __name__ == "__main__":
    main()
