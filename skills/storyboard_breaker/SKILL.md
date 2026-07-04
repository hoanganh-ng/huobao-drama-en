---
name: storyboard-breaker
description: Storyboard breaking — professional conventions for breaking scripts into shots
---

# Storyboard Breaker Guide

## Breaking principles

Each shot focuses on a **single action**; descriptions must be detailed and specific. Each shot is 10-15 seconds.

## Shot elements

1. **Shot title**: 3-5 character summary of the core content (e.g. "Wakes from a nightmare")
2. **Time**: specific time of day + lighting description
3. **Location**: full scene description + spatial layout + environmental details
4. **Framing**: wide / full / medium / close-up / extreme close-up
5. **Angle**: eye-level / low / high / side / behind
6. **Movement**: static / push-in / pull-out / pan / follow / track
7. **Action**: who + how specifically + body details + expression
8. **Dialogue**: the full dialogue of this shot
9. **Result**: the immediate consequence of the action + visual details
10. **Atmosphere**: lighting + color tone + sound + overall mood
11. **Duration**: each shot 10-15 seconds
12. **Image prompt**: `image_prompt`, used for first frame / last frame / shot image generation
13. **Video prompt**: `video_prompt`, video-generation description in 3-second chunks (required)
14. **BGM prompt**: `bgm_prompt`, describes the suitable BGM style for this shot
15. **Sound effect**: `sound_effect`, describes the key environmental / action sound for this shot
16. **Scene link**: if an existing scene can be matched, `scene_id` must be filled in
17. **Character link**: fill in `character_ids`, binding 0 to many characters in this shot

## Video prompt format

Each shot must include a `video_prompt` field to drive AI video generation:

```
0-3s: <location>coffee shop</location>, close-up, <role>Xiaoming</role> looking down at his phone, anxious expression.
<n>3-6s: <location>coffee shop</location>, wide shot, doorbell rings, <role>Xiaohong</role> pushes the door and walks in.
<n>6-9s: <location>coffee shop</location>, medium shot, <role>Xiaohong</role> smiles and walks toward Xiaoming, sits down.
```

Tag reference:
- `<location>location</location>` — scene marker
- `<role>character name</role>` — character marker
- `<voice>character name</voice>` — voiceover / narration marker
- `<n>` — time-segment separator

## Usage steps

1. Call `read_storyboard_context` to read the script, characters, scenes, and existing storyboard summary
2. First finish the shot break based on the script; ensure total duration and narrative continuity are reasonable
3. Fill in complete fields for each shot: `title / shot_type / angle / movement / location / time / character_ids / action / dialogue / description / result / atmosphere / image_prompt / video_prompt / bgm_prompt / sound_effect / duration / scene_id`
4. Call `save_storyboards` to save the complete storyboards in one pass
5. If adjustment is needed, call `update_storyboard` to modify a specific shot

## Scene linking rules

- Prioritize using the `scenes` returned by `read_storyboard_context`
- When `location + time` is a clear match, the correct `scene_id` must be back-filled
- Do not invent non-existent scene IDs
- If the script clearly falls within an existing scene, do not re-create a new scene description

## Character binding rules

- `character_ids` must be selected from the character list returned by `read_storyboard_context`
- A shot may have no characters, or it may bind multiple characters
- As long as a character clearly appears, is seen, performs actions, or speaks in the shot, they should be bound
- Pure environment shots, empty shots, and object-only shots may pass an empty array

## Quality requirements

- `description` is for human reading, `video_prompt` is for model generation — do not replace one with the other
- `image_prompt` should highlight single-frame composition, character appearance, environment, and lighting
- `video_prompt` should highlight time progression, action changes, and camera language
- `bgm_prompt` and `sound_effect` can be concise phrases, but not so generic that they only read "tense" or "sad"
- When narration exists, write it uniformly into `dialogue` in the format `Narrator: content`
