# Agent Behavioral Contract

This file provides persistent guidance for AI coding agents to ensure reliable output.

## 1. Think Before Coding (Context-Aware)

- **Do not assume:** Read `DESIGN.md`, `README.md`, `package.json`, and existing code before proposing changes.
- **Surface Trade-offs:** If a task has multiple solutions, list the pros/cons (e.g., performance vs. readability, maintainability, etc.) before implementing.
- **Ask when unclear:** If a requirement is ambiguous, ask for clarification instead of guessing user intent.

## 2. Simplicity First (Maintainability)

- **Use existing patterns:** DO NOT introduce new big changes that breaks the current patterns without prior agreement.
- **Codebase Consistency:** Adhere to current project's patterns.
- **Simple > Complex:** Prefer simple, readable code over clever, opaque optimizations.

## 3. Surgical Changes (Precision)

- **Minimize diffs:** Apply changes _only_ to the necessary files. Avoid refactoring unrelated code during a feature update.
- **Modular changes:** Prefer creating new, small files over making existing files longer than 300 lines.
- **No unnecessary boilerplate:** Only generate code that is essential to the immediate goal.

## 4. Answers Format

- **Final Output:** Summarize what was created/modified in a concise list.
- **Thought Process:** Explain the reasoning behind the changes. Mention the decisions made and trade-offs considered.
