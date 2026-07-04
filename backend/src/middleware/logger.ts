import type { MiddlewareHandler } from 'hono'

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function statusColor(status: number): string {
  if (status >= 500) return colors.red
  if (status >= 400) return colors.yellow
  if (status >= 300) return colors.cyan
  return colors.green
}

function formatTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

/**
 * Global request logger — prints method/path/status/elapsed/body
 */
export const requestLogger: MiddlewareHandler = async (c, next) => {
  const method = c.req.method
  const path = c.req.path
  const start = performance.now()

  // Log request
  const time = formatTime()
  let bodyInfo = ''
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      const clone = c.req.raw.clone()
      const text = await clone.text()
      if (text) {
        const truncated = text.length > 500 ? text.slice(0, 500) + '...' : text
        bodyInfo = `\n  ${colors.dim}body: ${truncated}${colors.reset}`
      }
    } catch {}
  }

  console.log(`${colors.dim}${time}${colors.reset} ${colors.cyan}${method}${colors.reset} ${path}${bodyInfo}`)

  await next()

  const ms = (performance.now() - start).toFixed(0)
  const status = c.res.status
  const sc = statusColor(status)
  console.log(`${colors.dim}${time}${colors.reset} ${colors.cyan}${method}${colors.reset} ${path} ${sc}${status}${colors.reset} ${colors.dim}${ms}ms${colors.reset}`)
}

/**
 * Global error handler — catches unhandled exceptions and prints the full stack
 */
export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  } catch (err: any) {
    const status = err.status || 500
    console.error(`${colors.red}[ERROR]${colors.reset} ${c.req.method} ${c.req.path}`)
    console.error(err.stack || err.message || err)
    return c.json({ code: status, message: err.message || 'Internal Server Error' }, status)
  }
}
