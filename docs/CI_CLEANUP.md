# CI cleanup

QuickToolBox is a Next.js/Node.js project. The CI configuration intentionally contains no Python/UV workflow, no GitHub Pages workflow, and no unconfigured Frogbot workflow.

Release gate:

`Pull Request → Next.js Build → Required Checks → Approval → Merge → Production`

The cleanup changes only GitHub Actions configuration and documentation; it does not deploy to production.
