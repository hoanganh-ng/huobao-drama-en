---
name: grid-image-generator
description: Image prompt generation guide — specification for character, scene, and grid image prompts
---

# Image Prompt Generation Guide

This SKILL corresponds to the `grid_prompt_generator` Agent. Supports three categories of image prompts:

1. **Character image prompt** — character appearance and temperament
2. **Scene image prompt** — scene atmosphere and lighting
3. **Grid image prompt** — multi-shot grid mosaic

See the `reference/` directory for detailed templates.

---

## Character image prompt

Reference: `reference/character-prompt.md`

### Template structure
```
[appearance], [personality/temperament], [role], [cinematic portrait], [high quality], [consistent art style], [no text, no watermark]
```

### Generation rules
- Center on `appearance` (physical description)
- `personality` determines the overall temperament (reserved / bold / mysterious, etc.)
- `role` determines the clothing and prop style
- Must include `cinematic portrait` + `consistent art style`
- Avoid text, signatures, watermarks

---

## Scene image prompt

Reference: `reference/scene-prompt.md`

### Template structure
```
[location], [time period], [lighting atmosphere], [scene description], [cinematic scene], [high quality], [consistent art style], [no text, no watermark]
```

### Generation rules
- Base on `location`
- `time` determines the lighting tone (day / night / dusk)
- Atmosphere words: atmospheric, moody, warm, cold, etc.
- Must include `cinematic scene` + `consistent art style`
- Avoid text, signatures, watermarks

---

## Grid image prompt

Reference: `reference/shot-prompt.md`

### Three modes

#### First-frame mode (first_frame)
Each cell = the opening frame of one shot, but you must strictly generate the user-specified `rows x cols` total cells.

```
[rows x cols grid layout], exactly [rows*cols] visible panels, consistent art style, [style description],
cell 1: [shot 1 opening scene],
cell 2: [shot 2 opening scene],
cell 3: [shot 3 opening scene],
...
cell N: [opening scene],
high quality, cinematic lighting, no merged panels, no missing panels, no text, no watermark
```

#### First/last-frame mode (first_last)
Keep the first/last frame rhythm, but you must still strictly generate the user-specified `rows x cols` total cells. You may NOT silently change it to `Nx2`.

```
[rows x cols grid layout], exactly [rows*cols] visible panels, consistent art style, [style description],
cell 1: [opening beat],
cell 2: [closing beat],
cell 3: [opening beat],
cell 4: [closing beat],
...
high quality, cinematic, continuous motion implied, no merged panels, no missing panels, no text
```

#### Multi-reference mode (multi_ref)
All cells are different angles / compositions of the same shot, but you must still strictly generate the user-specified `rows x cols` total cells.

```
[rows x cols grid layout], exactly [rows*cols] visible panels, same scene different angles, [style description],
[main scene description],
cell 1: wide shot establishing,
cell 2: medium shot character focus,
cell 3: close-up detail,
cell 4: dramatic angle,
...
consistent lighting and color palette, no merged panels, no missing panels, no text
```

### General rules
1. Prompts are in **English**
2. Must explicitly write the user-specified `rows x cols grid layout`
3. Must include `consistent art style` to keep style unified
4. Must explicitly require `exactly N visible panels`
5. Must explicitly require `no merged panels, no missing panels`
6. Avoid describing dividers between cells
7. Recommended size: 960x540 per cell, full image = 960*cols × 540*rows
8. When reference images exist, uniformly use `image 1 / image 2 / ...` for reference images, and do not mix this with `cell 1 / cell 2 / ...`
