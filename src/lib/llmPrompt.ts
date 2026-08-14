export function buildImportPrompt(): string {
  return `You are converting freetext workout notes into JSON for import into a workout tracker app.

Output ONLY a single JSON code block, no commentary, matching exactly this shape:

\`\`\`json
{
  "format": "simple-v1",
  "workouts": [
    {
      "date": "2026-01-08",
      "note": "optional workout-level note",
      "entries": [
        { "exercise": "Row", "weight": 70, "reps": 8, "note": "optional", "sets": [{ "weight": 70, "reps": 8 }] }
      ]
    }
  ]
}
\`\`\`

Conversion rules:
- Weights are in kg. Convert decimal commas to dots (22,5 becomes 22.5). Strip units like "kg".
- Lines of dashes (——, ---, ___ or similar) separate workouts. Each block is one workout. Assume blocks are in chronological order, oldest first, unless the notes say otherwise.
- "Row: 70 kg PB" means exercise "Row" at weight 70. Drop "PB" markers — the app recomputes personal bests itself.
- Parenthetical or trailing comments ("with straps", "(downstairs machine)", "only 9 reps!!") go into the entry "note". If a rep count is stated, also set "reps" as a number.
- Use one consistent spelling per exercise across all workouts (e.g. "RDL" and "Rdl" are the same exercise — pick one).
- "reps", "sets", and "note" are optional — omit them when unknown. Never invent data that is not in the notes.
- An entry with a name but no weight (e.g. "Lat raises:") should be skipped.
- If the notes contain no dates, ASK the user for the date range (date of the first and the last workout) before answering, then space the workouts evenly within that range using "YYYY-MM-DD" dates.

My notes are below. Convert them:
`;
}
