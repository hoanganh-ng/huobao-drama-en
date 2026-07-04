---
name: character-scene-extractor
description: Conventions and methods for character and scene extraction
---

# Character & Scene Extraction Guide

## Character extraction specification

The character information to extract includes:
- **Name**: character's full name
- **Role**: lead / supporting / extra
- **Appearance**: gender, age, build, facial features, hairstyle, clothing (300-500 words)
- **Personality**: core personality tags
- **Description**: backstory and relationships

## Scene extraction specification

The scene/background information to extract includes:
- **Location**: specific place name
- **Time**: time of day and lighting conditions
- **Atmosphere**: environmental atmosphere description
- **Prompt**: English prompt for AI image generation (pure background, no characters)

## Prop extraction specification

The prop information to extract includes:
- **Name**: prop name
- **Type**: daily / weapon / vehicle / decoration, etc.
- **Description**: appearance and use
- **Image prompt**: English prompt for AI image generation

## Usage steps

1. Call `read_script_for_extraction` to read the current episode's script
2. Call `read_existing_characters` to view the project's existing characters and those already linked to the current episode
3. Call `read_existing_scenes` to view the project's existing scenes and those already linked to the current episode
4. Only extract characters and scenes that truly appear in the current episode
5. Call `save_dedup_characters` to save the characters and automatically link them to the current episode
6. Call `save_dedup_scenes` to save the scenes and automatically link them to the current episode

## Current-episode rules

- Goal: complete the characters and scenes required for the "current episode", not re-scan the whole project
- If a character or scene already exists in the project but is not yet linked to the current episode, still reuse and link it
- If a same-name character or same-location-same-time scene already exists in the project, prefer reuse — do not create duplicates
