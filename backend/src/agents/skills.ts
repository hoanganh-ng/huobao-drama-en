import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SKILLS_DIR = path.resolve(__dirname, '../../../skills')
const AGENT_SKILL_MAP: Record<string, string[]> = {
  script_rewriter: ['script_rewriter'],
  extractor: ['extractor'],
  storyboard_breaker: ['storyboard_breaker'],
  voice_assigner: ['voice_assigner'],
  grid_prompt_generator: ['grid_prompt_generator'],
}

function stripFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content.trim()
  const end = content.indexOf('\n---', 3)
  if (end === -1) return content.trim()
  return content.slice(end + 4).trim()
}

function readSkill(skillId: string): string {
  const skillPath = path.join(SKILLS_DIR, skillId, 'SKILL.md')
  if (!fs.existsSync(skillPath)) return ''

  const raw = fs.readFileSync(skillPath, 'utf-8')
  const content = stripFrontmatter(raw)
  if (!content) return ''

  return [
    `## Skill: ${skillId}`,
    content,
  ].join('\n')
}

export function loadAgentSkills(agentType: string): string {
  const skillIds = AGENT_SKILL_MAP[agentType] || []
  const contents = skillIds
    .map(readSkill)
    .filter(Boolean)

  if (!contents.length) return ''

  return [
    'Below are the project skill specifications (SKILL.md) exclusive to this Agent.',
    'Different Agents load different skills; you only need to follow the skills currently injected.',
    'You must prioritize following these specifications as long as they do not violate current tool boundaries; if they conflict with explicit user requirements, the user requirements take precedence.',
    '',
    contents.join('\n\n'),
  ].join('\n')
}
