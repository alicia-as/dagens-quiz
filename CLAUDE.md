# dagens-quiz

Daily Norwegian quiz. One JSON file per quiz day in `questions/`.

## Daily quiz workflow

- File is `questions/YYYYMMDD.json`, created the day **before** it runs (commit on the 9th → file dated the 10th).
- Weekdays only — no files for Saturday or Sunday.
- Commit quiz files **directly to `main` and push**. Do not put them on a feature branch.
- Never bundle a quiz file with code changes in the same branch. Quizzes are
  time-sensitive; code review is not. In September 2026 the quizzes for the 8th
  and 9th sat unmerged on `codex/quiz-usability` behind a UI refactor and missed
  their dates entirely. If you are doing code work, keep it in a separate branch
  with no `questions/` files in it.

## Quiz file format

```json
{
  "theme": "Tvillinger",
  "questions": [
    { "question": "...", "answer": "Roma", "aliases": ["Rom", "Rome"] }
  ]
}
```

- Exactly 5 questions. Theme and questions in Norwegian.
- `aliases` is optional but matters: answers are matched by lowercased exact
  string (`app/components/IndexPage.tsx`), so add every plausible spelling —
  surname-only, word order variants, Norwegian/English forms.
- No index to update. `pages/api/questions.ts` reads the directory by filename.

## Picking a theme

Check `questions/*.json` for the existing themes before proposing one — there
are 660+ and repeats are marked `(repeat)` in the theme string when deliberate.
Vary the domain from the previous week or two.

## User-approved example: wordplay quizzes

See `examples/quiz/kroppsdel-ordlek.json` for a five-question selection explicitly
approved by the user on 2026-10-04 as a good example to learn from. This is a
reference, not a scheduled quiz.

- Read actual past questions for inspiration, not just their theme titles.
  Useful references: `questions/20250808.json` (Fjern to bokstaver),
  `questions/20240605.json` (Bytt en bokstav), and
  `questions/20240516.json` (Gøy med første bokstav!).
- The user rejected simple fill-in-the-blank clues such as “Et svært kort
  tidsrom: ___blikk” as boring. Prefer two meaningful clues connected by an
  exact word transformation, giving the player an insight to discover.
- Connect different knowledge areas with concrete clues: Halsbrann becomes
  Brann (a complaint and a football club); Nesebor becomes bor (anatomy and
  chemistry); Håndverker becomes verker (trades and literature/music).
- Use playful, surprising connections, as in Lårhøne → høne and Fotsopp → sopp.
  Keep wording concise and natural, without giving away the missing letters.
- Make the operation exact: remove the body-part word without rearranging or
  changing the remaining letters. Both clues must fit independently.
- Vary the subject matter and difficulty within the same mechanic. Verify
  factual clues and ambiguous words before presenting the candidates.
- For this format, use the complete starting word as `answer`; the example
  also accepts the resulting word and relevant spelling variants as aliases.
- When asked for candidates, present candidates for selection before creating
  a dated quiz. Keep reference examples outside `questions/` so they cannot
  accidentally become live quizzes.
