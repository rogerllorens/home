import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("migration 017 añade metadata universal de importación", () => {
  const sql = readFileSync("supabase/sql/017_universal_import_metadata.sql", "utf8");
  for (const column of ["import_source_type", "import_original_file_name", "import_sheet_name", "import_encoding", "import_delimiter", "import_platform_guess", "import_mapping_confidence", "import_warnings"]) {
    assert.match(sql, new RegExp(column));
  }
  assert.match(sql, /jobs_import_source_type_check/);
});
