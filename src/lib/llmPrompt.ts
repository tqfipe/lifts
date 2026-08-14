export function buildImportPrompt(): string {
  return `You are converting freetext workout notes into JSON for import into a workout tracker app. The notes may come in any personal format, style, or language — infer the structure rather than assuming one.

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
- Output weights in kg as plain numbers. Convert decimal commas to dots (22,5 becomes 22.5) and strip unit suffixes. If the notes use pounds (lb/lbs/#), convert to kg (multiply by 0.4536, round to at most 2 decimals) and put the original value in the entry "note" (e.g. "135 lb").
- Workout boundaries vary by author: separator lines (——, ---, ***, blank lines), date headings ("Monday", "3/7", "Push day 12 Jan"), or numbered sessions. One block = one workout. Assume chronological order, oldest first, unless the notes indicate otherwise.
- Dates: if the notes contain dates, convert them to "YYYY-MM-DD" (infer the year from context if missing; ask the user if ambiguous). If the notes contain NO dates, ASK the user for the date range (first and last workout) before answering, then space the workouts evenly within it.
- Rep/set shorthand should become proper "sets": "10+8", "9&5", "3x8 @ 60" (three sets of 8 at 60), "65kg, 70kg" (two sets at different weights). A single stated rep count becomes "reps". The top-level "weight" is the heaviest set.
- Markers like "PB", "PR", "new max" should be dropped — the app recomputes personal bests itself.
- Everything else the author wrote about an entry (form cues, equipment, "with straps", "(downstairs machine)", "only 9 reps!!") goes into that entry's "note" verbatim. General session remarks go into the workout-level "note".
- Use one consistent spelling per exercise across all workouts ("RDL", "Rdl", and "rdl" are the same exercise — pick one). Keep exercise names in the author's language; do not translate.
- "reps", "sets", and "note" are optional — omit them when unknown. Never invent data that is not in the notes.
- An entry with a name but no weight (e.g. "Lat raises:") should be skipped. Bodyweight-only exercises without a load cannot be imported — list them after the JSON block so the author knows they were left out.

My notes are below. Convert them:
`;
}
