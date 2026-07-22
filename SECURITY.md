# Security Policy

## Supported versions

Security fixes land on the default branch (`main`) and the active integration
branch (`dev`). Older tags are not patched unless noted in a release.

## Reporting a vulnerability

**Do not open a public GitHub issue for security reports.**

Prefer one of:

1. **GitHub Security Advisories** — [Report a vulnerability](https://github.com/rabira-hierpa/dandii/security/advisories/new) on this repository (private to maintainers).
2. **Email** — `rabira.hierpa@gmail.com` with subject `[Dandii security]`.

Please include:

- Affected URL, endpoint, or component
- Steps to reproduce
- Impact (e.g. data exposure, privilege escalation, injection)
- Whether you have a proof of concept (attach privately; do not post publicly)

You should get an acknowledgement within a few days. We will work with you on
a fix and disclosure timeline. Please give us a reasonable window before any
public disclosure.

## Scope

In scope:

- Authentication / session handling (better-auth)
- Authorization / RBAC bypasses in console or server actions
- SQL / Prisma injection or unsafe raw queries
- Exposure of secrets, PII, or fare-proposal abuse that can corrupt production data
- XSS / CSRF on authenticated surfaces

Out of scope (unless you can show practical impact):

- Denial of service via large GTFS uploads or rate limits alone
- Issues that require a compromised maintainer account
- Findings in third-party dependencies without a concrete exploit path in this app
- Social engineering of end users

## Safe harbor

We will not pursue legal action against researchers who:

- Act in good faith and avoid privacy violations, data destruction, and service disruption
- Report privately first and do not exploit findings beyond what is needed to demonstrate the issue
- Do not access data that is not their own beyond the minimum needed for the report

## Secrets in this project

Never commit `.env`, OAuth client secrets, or database credentials. Use
`web/.env.example` as the template. Rotate any credential that may have been
exposed in a PR or log.
