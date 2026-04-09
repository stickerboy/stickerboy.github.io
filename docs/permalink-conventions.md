# Permalink Conventions

This project centralizes routing in `eleventy.config.js` via `eleventyComputed.permalink`.

## Precedence order

Permalinks resolve in this order:

1. `customPermalink` in front matter (explicit override)
2. Computed section permalinks for flat content folders
3. Computed permalinks for flat files in `pages/`
4. Computed changelog permalinks
5. Fallback to `data.permalink` if present

## Section mapping

Flat content files map as follows:

- `projects/*.njk` -> `/projects/{slug}/`
- `photography/*.njk` -> `/photography/{slug}/`
- `showcase/*.njk` -> `/about/{slug}/`

Index files map to section roots:

- `projects/index.njk` -> `/projects/`
- `photography/index.njk` -> `/photography/`
- `showcase/index.njk` -> `/about/`

## Pages folder behavior

Flat files in `pages/` map to slug routes:

- `pages/smirkle.njk` -> `/smirkle/`
- `pages/pFkcklHa.njk` -> `/pFkcklHa/`
- `pages/ouroboros.html` -> `/ouroboros/`

The extension is stripped, and output uses a trailing slash route.

## Changelog behavior

Files under `changelog/` map to:

- `/changelog/{fileSlug}/`

## When to use customPermalink

Use `customPermalink` only when a page needs a route that intentionally differs from project conventions.

Example:

```yaml
customPermalink: /my-special-route/
```

## Recommended front matter practice

For the flattened content collections (`projects`, `photography`, `showcase`, `pages`):

- Do not add `permalink` unless you need a special case
- Prefer convention-based computed routes
- Use `customPermalink` for explicit exceptions
