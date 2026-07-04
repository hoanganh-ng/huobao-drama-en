---
name: voice-assigner
description: Character voice assignment principles and voice library
---

# Voice Assigner Guide

## Assignment principles

1. **Gender match**: male characters use male voices, female characters use female voices
2. **Age match**: young / youth / middle-aged / elderly map to different voices
3. **Personality match**:
   - Lively, cheerful → bright, energetic voice
   - Steady, reserved → low, deep voice
   - Gentle, caring → soft, sweet voice
   - Authoritative, domineering → deep, powerful voice
4. **Role positioning**: lead roles get distinctive voices, supporting roles get neutral voices

## Usage steps

1. Call `list_voices` to view the available voice list
2. Call `get_characters` to get all character information
3. Analyze each character's personality, age, and gender
4. Call `assign_voice` for each character to assign a suitable voice
5. Summarize the assignment results to the user
