# Pakjiwoo Studio V9

## Project structure

```text
images/project/
├── fashion-editorial/
│   ├── city-woman/
│   ├── tokyo-movement-2024/
│   ├── swim-in-peace/
│   └── night-in-seoul-city-2023/
├── travel-series/
│   ├── japan/
│   │   ├── kyoto-vol-1/
│   │   ├── kyoto-vol-2/
│   │   └── ...
│   ├── california/
│   └── mongolia/
├── film-work-2020-2023/
└── maurizio-cattelan-x-leeum-museum/
```

## Commercial order

1. Fashion
2. Beauty / Skincare
3. Lifestyle / Wellness
4. Artist / Event

The order is controlled by each category's `_meta.json`.

## Adding a new Project section

Create a folder inside `images/project/` and add `_meta.json`:

```json
{
  "title": "New Section",
  "order": 5
}
```

## Adding a project

Create a folder inside a section and place numbered images inside:

```text
images/project/fashion-editorial/new-project/
├── 001.jpg
├── 002.jpg
└── _meta.json
```

```json
{
  "title": "New Project"
}
```

## Adding a nested collection

You can create another folder level, as used by Japan:

```text
images/project/travel-series/japan/new-volume/001.jpg
```

Vercel scans all folder levels automatically.

## Updating

1. Change folders or images in Finder.
2. GitHub Desktop → Summary.
3. Commit to main.
4. Push origin.
5. Vercel automatically rebuilds.
