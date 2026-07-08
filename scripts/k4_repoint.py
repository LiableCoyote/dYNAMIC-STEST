#!/usr/bin/env python3
import re, sys, pathlib

repo_root = pathlib.Path(__file__).resolve().parent.parent
map_path = repo_root / "scripts" / "k4_repoint_map.txt"
scenes_root = repo_root / "source" / "scenes"

mapping = {}
for line in map_path.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line:
        continue
    old, new = line.split("|")
    mapping[old] = new

pattern = re.compile(r'^(\s*#?(?:card-image|set-bg):\s*)(\S+)\s*$')

total_replacements = 0
files_changed = set()
unmatched_old_paths = set(mapping.keys())

for dry_file in scenes_root.rglob("*.dry"):
    lines = dry_file.read_text(encoding="utf-8").splitlines(keepends=True)
    changed = False
    for i, line in enumerate(lines):
        m = pattern.match(line.rstrip("\n"))
        if not m:
            continue
        prefix, old_path = m.group(1), m.group(2)
        if old_path in mapping:
            new_path = mapping[old_path]
            newline_ending = "\n" if line.endswith("\n") else ""
            lines[i] = f"{prefix}{new_path}{newline_ending}"
            changed = True
            total_replacements += 1
            unmatched_old_paths.discard(old_path)
    if changed:
        dry_file.write_text("".join(lines), encoding="utf-8")
        files_changed.add(str(dry_file.relative_to(repo_root)))

print(f"Replaced {total_replacements} reference(s) across {len(files_changed)} file(s).")
for f in sorted(files_changed):
    print(f"  {f}")

if unmatched_old_paths:
    print("\nMap entries with zero matches (check for typos):")
    for p in sorted(unmatched_old_paths):
        print(f"  {p}")
    sys.exit(1)
