# Learnings

Short write-ups of bugs that reached a build and the change in habit that would have caught them.
One file per learning, named `NNN-short-slug.md`.

A learning earns a file here when the bug was **invisible to a correct-looking test suite**: the
code did what its tests asserted, and the tests asserted the wrong thing. Fixes for ordinary
mistakes belong in the commit that fixes them, not here.

| #   | Learning                                                                          | Came from                                                                              |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 001 | [Fast Refresh splits module-level state](001-fast-refresh-splits-module-state.md) | Scanner rejected every scan after the first as a version conflict during a dev session |
