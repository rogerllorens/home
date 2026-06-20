# CSV Import

CSV import supports comma, semicolon, tab and pipe delimiters, UTF-8 BOM, Windows-1252/Latin-1 conversion, duplicate header renaming, quoted newlines and irregular row warnings. Spanish Excel exports using `;` and Windows-1252 are decoded automatically.

The parser preserves original headers for mapping, trims values, truncates oversized cells with warnings and produces a normalized UTF-8 CSV for the existing worker flow.
