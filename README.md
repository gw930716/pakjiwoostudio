# Pakjiwoo Studio V8 — Automatic Folder Structure

This version automatically scans image folders during every Vercel deployment.

## Folder structure

```text
images/
├── home/
│   ├── 001.jpg
│   └── 002.jpg
├── project/
│   └── project-folder/
│       ├── 001.jpg
│       └── 002.jpg
└── commercial/
    └── category/
        └── brand/
            └── campaign/
                ├── 001.jpg
                └── 002.jpg
```

## Home slideshow

Add images to `images/home/`.

Filename order controls slideshow order:

```text
001.jpg
002.jpg
003.jpg
```

## Add a personal project

Create a folder inside `images/project/` and put images inside it.

Example:

```text
images/project/new-project/001.jpg
```

The website automatically displays `New Project`.

For a custom title, add `_meta.json`:

```json
{
  "title": "New Project, 2026",
  "group": "Projects"
}
```

## Add a commercial campaign

Create the following nested folders:

```text
images/commercial/fashion/marithe/26fw-campaign/
```

Put the campaign images inside that folder.

The website will automatically create:

```text
Commercial
→ MARITHÉ
→ 26fw Campaign
→ Gallery
```

Use `_meta.json` inside any category, brand or campaign folder for exact display text.

Example:

```json
{
  "title": "26FW Campaign"
}
```

## Updating the website

1. Add or rearrange folders and images in Finder.
2. Open GitHub Desktop.
3. Enter a Summary.
4. Click `Commit to main`.
5. Click `Push origin`.
6. Vercel rebuilds the site automatically.

## Image order

Images are sorted naturally by filename. Use:

```text
001.jpg
002.jpg
003.jpg
```

No image is automatically cropped.
