# Documentation

This folder contains implementation notes for reusable template helpers and routing conventions.

## Available docs

- [Asset Image Path Helper](./asset-image-path.md)
- [Permalink Conventions](./permalink-conventions.md)

## Quick reference

### Image helper

Use `assetImagePath(imagePath, extension, group, tags, size)` to build image paths under `/assets/img/` consistently.

### Permalinks

Permalinks are mostly computed in `eleventyComputed.permalink` in `eleventy.config.js`, with `customPermalink` available for explicit overrides.

## Add New Content Checklist

### Add a project

1. Create a new file in `projects/` named `{slug}.njk`.
2. Add front matter with at least: `title`, `pageHeading`, `tags: [projects]`, `projectId`, `summary` (and `featured` if needed).
3. For images, use `projectId` and the helper pattern:
	- `{{ projectId | assetImagePath('png', '', tags, 'sm') }}` for cards
	- `{{ projectId | assetImagePath('png', '', tags, 'lg') }}` for hero/detail images
4. Do not add `permalink` unless you need a special route override.

### Add a photography entry

1. Create a new file in `photography/` named `{slug}.njk`.
2. Add front matter with at least: `title`, `pageHeading`, `tags: [photographs]`, `photoId`, `summary`.
3. Use image helper pattern:
	- `{{ photoId | assetImagePath('jpg', '', tags) }}`
4. Skip `permalink` unless a custom route is required.

### Add a showcase/about entry

1. Create a new file in `showcase/` named `{slug}.njk`.
2. Add front matter with at least: `title`, `pageHeading`, `tags: [showcases]`, `summary`, `image`.
3. Use image helper pattern:
	- `{{ image | assetImagePath('', 'showcase', tags) }}`
4. Route is computed automatically to `/about/{slug}/`.

### Add a flat page entry

1. Create a top-level file in `pages/` (for example: `pages/example.njk` or `pages/example.html`).
2. Set usual front matter fields (`title`, `layout`, etc.) as needed.
3. Route is computed automatically to `/{slug}/`.
4. Use `customPermalink` only for exceptions.

### Validate

1. Run `npm run build`.
2. Confirm the page appears at the expected route.
3. Confirm image URLs resolve under `/assets/img/`.
