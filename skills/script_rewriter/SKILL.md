---
name: script-rewriter
description: Methodology and conventions for adapting novels into formatted screenplays
---

# Script Rewriter Guide

## Rewriting principles

1. **Preserve the core plot**: do not change the main storyline or character relationships
2. **Enhance the visual feel**: turn narrative prose into visualizable scene descriptions
3. **Dialogue-driven**: drive the plot with dialogue, reduce narration
4. **Pace control**: each scene 30-60 seconds, suitable for short video
5. **No camera language**: do not touch shot type, angle, or movement — those belong to the storyboard-breaking step

## Formatted screenplay format

```
## S01 | Interior · Coffee shop | Dusk

The dusk light streams through the floor-to-ceiling windows, steam rising from the coffee cup on the counter.

Xiaoming sits alone in a corner booth, looking down at his phone, a bit anxious.

The doorbell rings. Xiaohong pushes the door open. Seeing Xiaoming, she smiles and walks over.

Xiaohong: (smiling) Have you been waiting long?
Xiaoming: (looking up) Not really, just got here.
```

### Format rules

- `## S<number> | Interior/Exterior · Location | Time of day` — scene header
- Action descriptions are natural paragraphs — no camera language
- `Character name: (state/expression) line content` — dialogue format

### Volume reference

A formatted screenplay is roughly 20-30% longer than the original content. The increase comes from scene headers and formatted dialogue, not from expansion.

## Rewriting steps

1. First call `read_episode_script` to read the original content
2. Analyze the content structure (ratio of dialogue, narration, inner monologue)
3. Call `rewrite_to_screenplay` to perform the rewrite
4. Check the result and confirm it follows the formatted screenplay format
5. Call `save_script` to save the final result

## Notes

- Inner monologue can be converted to character expression/action or voiceover
- Split long narrative passages into multiple short scenes
- Make sure each scene has a clear emotional turning point
- Keep characters' speaking style consistent
- Scene numbers increase continuously (S01, S02, S03...)
- Time of day must be specific (dusk, late night, early morning), not the vague "daytime"
