# How to add new math exercise sets

Create and store all new exercise folders and files directly in the math repo at `/Users/bobovnii/Documents/business/math`, not in the HTML mirror. This repo uses shared quiz templates located at `/Users/bobovnii/Documents/business/math/templates/` and topic folders under `de/Fifth/Math/` (e.g., `NumbersAndOperations`, `WholeNumbersPlaceValue`, `OperationsWithWholeNumbers`, `Fractions`). All exercises should link to templates via the path that reaches `/Users/bobovnii/Documents/business/math/templates/` (e.g., `../../../../templates/template_6buttons.css` from `…/de/Fifth/Math/…` or another correct relative path if the depth differs).

## 1) Collect curriculum topics
- Get the specific country and grade (e.g., Germany, Grade 5). If online access is allowed, skim official curriculum/teacher sites or reputable textbooks for topic lists. If offline/restricted, state that and use standard knowledge.
- Capture big topics and subtopics (e.g., Whole Numbers → place value, rounding, comparison; Fractions → equivalent, simplify, add/subtract like denominators, mixed numbers).

## 2) Draft the program in README schema
- Use the existing structure in `de/Fifth/Math/README.md`:
  - Big topic (### heading)
  - Subtopic bullet
  - Exercise name with template type in parentheses (6-button multiple choice, 9-button formula builder, 12-button keypad)
  - One-line hint
  - Two short examples (direct and inverted/variant), answers included
- Keep names concise, kid-friendly, and unique; align with the chosen template interaction.

## 3) Create folders and files
- Add a new CamelCase folder under `de/Fifth/Math/` for each big topic (matching `NumbersAndOperations` style). Inside, create one HTML per exercise. File names: lowercase_with_underscores and descriptive.
- Link assets to the shared templates with `../../templates/template_6buttons.css` (and `.js`), similarly for 9- and 12-button versions.
- Serve from the project root `de/Fifth/Math` (or use `file://`) so `../../templates/…` resolves. If serving from deeper, switch to root-relative `/templates/…`.

## 4) Build each exercise page
- Pick the template based on interaction:
  - 6-button multiple choice: define `window.QUIZ_CONFIG` with `questions` array, each having `prompt`, `instruction`, `options`, `correctIndex`. Add random generators where sensible and ensure `options.length === 6`.
  - 12-button keypad: set `buildQuestions()` returning `{ prompt, instruction, answer }`; set `keySymbols` as needed (add `/` or `+` when fractions/mixed numbers), `maxInputLength`, and optionally `normalizeAnswer`.
  - 9-button formula builder: set `tokens`, `name`, `description`, `placeholder`, and `normalize` if needed.
- Randomization: generate fresh numbers within grade-appropriate ranges; avoid negatives unless intended. Ensure distractors are plausible and always include the correct answer.
- Keep prompts brief; instructions explain the action (add, round, compare, etc.).

## 5) Quality checks
- Open in browser with DevTools Console/Network to catch 404s for template files. If templates 404, adjust paths.
- Verify `questions` arrays aren’t empty and `correctIndex` points to the correct option.
- For keypad quizzes, confirm `normalizeAnswer` handles commas/periods when needed.

## 6) Path reference quick guide
- Template imports from topic HTMLs: `../../templates/template_6buttons.css` and `../../templates/template_6buttons.js` (or 9/12 variants).
- Template directory: `/Users/bobovnii/Documents/business/math/templates/`.
- Topic roots (current): `de/Fifth/Math/NumbersAndOperations`, `de/Fifth/Math/WholeNumbersPlaceValue`, `de/Fifth/Math/OperationsWithWholeNumbers`, `de/Fifth/Math/Fractions`.

## 7) Deliverables
- Updated `README.md` with new topics/exercises/hints/examples/templates.
- New HTML files per exercise under the appropriate topic folder, using the shared templates and randomized question builders.
- Brief note if online sources weren’t reachable and curriculum was inferred.
