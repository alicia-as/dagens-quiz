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
