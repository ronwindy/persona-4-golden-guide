# Agent Instructions

## Version Control

- **Git Operations:** Never execute mutating git actions (`git commit`, `git push`, `git checkout -b`, `git reset`, `git rebase`) without explicit approval. Read-only commands (`git status`, `git diff`, `git log`, `git branch`) are allowed without approval.

## Testing & Verification

- **Browser Testing:** Do not use browser testing or browser automation tools unless explicitly prompted by the user. Let the user do all verification themselves.

## Script Execution & Safety

- **Routine Commands (Exempt from detailed breakdown):**
  Standard package management, build, lint, and run commands (e.g., `npm install`, `npm run dev`, `npm run build`, `pnpm`, `yarn`, `npx eslint`) require NO detailed explanation. You may execute these directly.

- **Complex Scripts & Multi-step Commands (Mandatory Explanation):**
  For any custom shell scripts (`.sh`, `.ps1`), multi-command chains (using `&&`, `|`, `;`, `>`, `>>`), regex manipulation, migration scripts, or destructive file operations (`rm`, `sed`, `find -delete`), you MUST output an explanation block before calling the tool:
  - **Purpose:** What the script does and why it is chosen over standard tooling.
  - **Impact:** Specific files, directories, or system states modified/created.
  - **Safety:** Why the operation is safe, idempotent, and non-destructive to unrelated files.

## File Modifications & Cleanliness

- **Scope Minimization:** Only modify code strictly relevant to the task. Do not reformat unrelated code, alter existing styling conventions, or remove legacy comments unless explicitly requested.
- **Read Before Write:** Always inspect existing files before proposing destructive or full-file replacements.

## Error Handling & Debugging

- **Retry Limit:** If a shell command or script fails twice consecutively with the same root error, halt execution immediately. Explain the failure mechanism, and propose an alternative plan or ask for clarification.
- **No Blind Suppression:** Do not suppress errors (e.g., adding `// @ts-ignore`, `--force`, or empty `catch` blocks) without explicit user permission.

## Security & Secrets

- **Secret Handling:** Never output the contents of `.env*` or credential files in conversational output or commit messages. Never hardcode credentials into scripts or source files.

## Communication & Planning Protocol

- **Analyze First:** Formulate a structured step-by-step plan before writing code or running scripts.
- **Clarification Triggers:** Stop and ask clarifying questions instead of making assumptions if:
  - Multiple viable architectural patterns exist for the task.
  - Key dependencies, file paths, or target behaviors are ambiguous.
  - Proposed changes introduce breaking API/schema modifications.
- **Direct Execution:** Proceed directly if the user's intent is deterministic and the scope is self-contained.