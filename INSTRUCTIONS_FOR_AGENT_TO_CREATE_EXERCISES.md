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
- Time and size caps: keep each question solvable in under 30 seconds. For quick fluency, cap addition/subtraction operands to 3-digit numbers and multiplication to at most a 2-digit number by a 1-digit number unless the topic explicitly requires more.
- Keep prompts brief; instructions explain the action (add, round, compare, etc.).
- Design for sub‑1‑minute completion per question: prefer 1–3 steps, keep numbers small/moderate (e.g., 2–4 digits for whole-number ops, denominators ≤10 for fractions, 1–2 decimal places), avoid long carry/borrow chains and multi-branch word problems; reduce question counts if needed.
- Respect template button limits: do not add extra keys beyond the shared templates. Instead, adjust the exercise to fit the existing keypad/symbol set (e.g., avoid negative outputs if there is no `-` key, or constrain fraction subtraction so answers stay positive).

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

## 8) Add DT JSON per final folder (from `example json.json`)
- For every “final” topic folder that directly contains the exercise HTMLs, add one JSON file named `DT_<lang>_<grade>_<subject>_<topic>.json` (e.g., `DT_uk_Fifth_Math_NumberAndPlaceValue.json`).
- Structure (array of entries) mirrors `example json.json`:
  - `TaskName`: the exercise name shown in README/HTML.
  - `TaskHTML`: the exercise filename without `.html`, prefixed by the language path (e.g., `en/Fifth/Math/AdditionAndSubtraction/column_add_to_a_million`).
  - `TaskTag.TagName`: fully qualified tag starting at `Education.<lang>.<grade>.<subject>.<topic>.<ExerciseCamelCase>` with a unique CamelCase tail per exercise.
  - `ChargesStatData`: choose one spell path from the known set and vary usage across exercises:
    - `/Game/Blueprints/Items/Weapon/BP_StatData_FireStaffCharges.BP_StatData_FireStaffCharges_C`
    - `/Game/GeometicalSpells/1FireCircle/BP_StatData_FireCirclesCharges.BP_StatData_FireCirclesCharges_C`
    - `/Game/Blueprints/Items/Weapon/BP_StatData_FireBallCharges.BP_StatData_FireBallCharges_C`
    - `/Game/GeometicalSpells/3FireTornado/BP_StatData_FireTornadoCharges.BP_StatData_FireTornadoCharges_C`
    - `/Game/GeometicalSpells/4WallOfFire/BP_StatData_WallOfFireCharges.BP_StatData_WallOfFireCharges_C`
    - `/Game/Blueprints/Items/Weapon/BP_StatData_ShieldCharges.BP_StatData_ShieldCharges_C`
    - `/Game/GeometicalSpells/8SmallGolem/BP_StatData_SmallGolemCharges.BP_StatData_SmallGolemCharges_C`
    - `/Game/GeometicalSpells/5MagicalNet/BP_StatData_MagicalNetCharges.BP_StatData_MagicalNetCharges_C`
- Include one JSON entry per exercise HTML in that folder.
- Add one extra “theme” entry per JSON with:
  - `TaskName`: `theme`
  - `TaskHTML`: human-readable grade/subject/topic path for UI, e.g., `5th grade.Math.Addition and Subtraction` (adapt topic text to the folder’s language).
  - `TaskTag.TagName`: empty string
  - `ChargesStatData`: empty string

## 9) Unwrap and mirror HTMLs to the HTML repo
- Read `/Users/bobovnii/Documents/business/math/README.md` for the unwrap command. Use `math/templates/unwrap_templates.py` to inline shared templates and mirror the tree into `/Users/bobovnii/Documents/business/HTML`, keeping relative paths intact.
- Match the language folder in the output root (e.g., input `.../math/en` → output root `/Users/bobovnii/Documents/business/HTML/en`) so files stay under the correct locale.
- Do **not** add extra buttons/keys; adjust exercises to fit templates before unwrapping.
- Ensure new files land in the matching subfolders under `/Users/bobovnii/Documents/business/HTML` after unwrapping.

## 10) Generate UE gameplay tag headers/sources for Math
- For each locale/grade in `/Users/bobovnii/Documents/business/HTML/<lang>/<Grade>/Math`, add `<lang><Grade>YearMath.h` and `<lang><Grade>YearMath.cpp` (one pair per grade) mirroring `de/Fifth/Math/deFifthYearMath.*`.
- Declare `Self` and one gameplay tag per exercise HTML: namespace chain `EpEducationTopics::<lang>::<Grade>::Math::<Topic>`, with `UE_DECLARE/DEFINE_GAMEPLAY_TAG` using CamelCase of the file stem (e.g., `fraction_compare.html` → `FractionCompare`) and tag strings `Education.<lang>.<Grade>.Math.<Topic>.<Exercise>`.
- Place these files alongside the math folders in the HTML mirror.
