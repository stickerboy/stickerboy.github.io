# Asset Image Path Helper

This project uses a shared image-path helper so templates do not need to manually build `/assets/img/`... strings.

It is available as both:
- Nunjucks filter: assetImagePath
- Nunjucks shortcode: assetImagePath

## Why this exists

Before this helper, templates repeatedly assembled image paths in different ways.
The helper now centralizes:
- base path prefixing
- section/group routing
- extension handling
- optional size suffixing
- tag-based group inference

## Signature

```twig
assetImagePath(imagePath, extension = "", group = "", tags = [], size = "")
```

## Parameters

- imagePath
  - Required base path or id.
  - Examples: convrtr, convrtr/convrtr, bg-showcase-1.jpg, assets/img/custom/example.png

- extension
  - Optional extension to append when imagePath does not already include one.
  - Examples: png, jpg

- group
  - Optional image group under `/assets/img`.
  - Typical values: projects, photography, showcase

- tags
  - Optional tag list used to infer group when group is not provided.
  - Inference map:
    - projects -> projects
    - photographs -> photography
    - showcases -> showcase

- size
  - Optional size suffix added before extension.
  - Examples: sm, lg

## Behavior rules

1. Empty imagePath returns an empty string.
2. Leading slashes are removed from imagePath.
3. If imagePath already starts with assets/img/, it is treated as already resolved and returned with a leading slash.
4. If group is missing, group is inferred from tags when possible.
5. If size is provided:
   - For projects with id-only imagePath, helper expands to id/id-size.
   - Otherwise helper appends -size before extension (or at the end if no extension exists yet).
6. If imagePath already has a file extension, no extension is appended.
7. If imagePath has no extension and extension is provided, extension is appended.
8. Final result is returned as an absolute site path beginning with `/assets/img/`.

## Common examples

### Projects list card image

Input:
- imagePath: project.data.projectId
- extension: png
- group: (empty)
- tags: project.data.tags
- size: sm

Usage:
```twig
{% set imagePath = project.data.projectId | assetImagePath('png', '', project.data.tags, 'sm') %}
```

Output pattern:
- `/assets/img/projects/{projectId}/{projectId}-sm.png`

### Project detail hero image

Usage:
```twig
{% set heroImage = projectId | assetImagePath('png', '', tags, 'lg') %}
```

Output pattern:
- `/assets/img/projects/{projectId}/{projectId}-lg.png`

### Photography image by id

Usage:
```twig
{% set imagePath = photo.data.photoId | assetImagePath('jpg', '', photo.data.tags) %}
```

Output pattern:
- `/assets/img/photography/{photoId}.jpg`

### Showcase image with filename already present

Usage:
```twig
{% set imagePathFull = imagePath | assetImagePath('', '', item.data.tags) %}
```

Output pattern:
- `/assets/img/showcase/{imageFileName}`

## Shortcode usage

You can call the same helper as a shortcode if preferred:

```twig
    {% assetImagePath imagePath, 'png', '', tags, 'lg' %}
```

## Notes

- If you want fully custom image locations, pass a path that already begins with `assets/img/`.
- For projects, passing only the project id plus size is the intended ergonomic path.
- This helper is defined in eleventy.config.js.
