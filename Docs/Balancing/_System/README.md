# Balancing system metadata

This folder contains technical provenance for the human-readable balancing workbook.

- TypeScript content and systems are the executable source of truth.
- Markdown is a manual review surface; the game does not parse it.
- The manifest records the export snapshot, authored IDs, document paths, runtime source mappings, registry counts, acquisition invariants, canonical edit locations, and generated mirrors.
- Normal content pages intentionally omit raw serialized objects and implementation-only field names.
- Run the coverage command after exporting to verify that every authored content ID remains represented.

The human pages are protected by default. Use the export command without --force to create missing files only. Use --force when intentionally regenerating a snapshot and accept that it replaces generated pages.
