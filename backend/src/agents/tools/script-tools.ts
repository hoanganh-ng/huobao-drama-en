/**
 * Script Rewriter Agent tools
 * Factory pattern — injects episodeId, so tools no longer need the LLM to pass the ID
 */
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { db, schema } from '../../db/index.js'
import { eq } from 'drizzle-orm'
import { now } from '../../utils/response.js'

export function createScriptTools(episodeId: number) {
  const readEpisodeScript = createTool({
    id: 'read_episode_script',
    description: 'Read the script content of the current episode.',
    inputSchema: z.object({}),
    execute: async () => {
      const [ep] = db.select().from(schema.episodes)
        .where(eq(schema.episodes.id, episodeId)).all()
      if (!ep) return { error: `Episode not found (id=${episodeId})` }
      const content = ep.content || ep.scriptContent
      if (!content) return { error: `Episode has no content (id=${episodeId})` }
      return { content, word_count: content.length, episode_id: episodeId }
    },
  })

  const rewriteToScreenplay = createTool({
    id: 'rewrite_to_screenplay',
    description: 'Read the original content for AI rewriting. Returns the source text with formatting instructions.',
    inputSchema: z.object({
      instructions: z.string().optional().describe('Additional rewrite instructions'),
    }),
    execute: async ({ instructions }) => {
      const [ep] = db.select().from(schema.episodes)
        .where(eq(schema.episodes.id, episodeId)).all()
      if (!ep) return { error: `Episode not found` }
      const source = ep.content || ep.scriptContent
      if (!source) return { error: `Episode has no content to rewrite` }

      return {
        source_content: source,
        instruction: `Please rewrite the following content into a formatted screenplay.

Formatting specification:
- Scene header: ## S<number> | Interior/Exterior · Location | Time of day
- Action description: natural paragraphs, no camera language
- Dialogue: Character name: (state/expression) line content
- Each scene should be 30-60 seconds of content

${instructions || ''}

【Original content】
${source}`,
      }
    },
  })

  const saveScript = createTool({
    id: 'save_script',
    description: 'Save the rewritten screenplay content to the current episode.',
    inputSchema: z.object({
      content: z.string().describe('The formatted screenplay content to save'),
    }),
    execute: async ({ content }) => {
      db.update(schema.episodes)
        .set({ scriptContent: content, updatedAt: now() })
        .where(eq(schema.episodes.id, episodeId))
        .run()
      return { message: `Script saved`, word_count: content.length }
    },
  })

  return { readEpisodeScript, rewriteToScreenplay, saveScript }
}
