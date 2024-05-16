import type { H3Event, SessionConfig } from 'h3'
import { useSession, createError, getRequestURL } from 'h3'
import { defu } from 'defu'
import { createHooks } from 'hookable'
import { useRuntimeConfig } from '#imports'
import type { UserSession, UserSessionRequired } from '#auth-utils'

export interface SessionHooks {
  /**
   * Called when fetching the session from the API
   * - Add extra properties to the session
   * - Throw an error if the session could not be verified (with a database for example)
   */
  fetch: (session: UserSessionRequired, event: H3Event) => void | Promise<void>
  /**
   * Called before clearing the session
   */
  clear: (session: UserSession, event: H3Event) => void | Promise<void>
}

export const sessionHooks = createHooks<SessionHooks>()

export async function getUserSession(event: H3Event) {
  return (await _useSession(event)).data
}
/**
 * Set a user session
 * @param event
 * @param data User session data, please only store public information since it can be decoded with API calls
 */
export async function setUserSession(event: H3Event, data: UserSession) {
  const session = await _useSession(event)

  await session.update(defu(data, session.data))

  return session.data
}

/**
 * Replace a user session
 * @param event
 * @param data User session data, please only store public information since it can be decoded with API calls
 */
export async function replaceUserSession(event: H3Event, data: UserSession) {
  const session = await _useSession(event)

  await session.clear()
  await session.update(data)

  return session.data
}

export async function clearUserSession(event: H3Event) {
  const session = await _useSession(event)

  await sessionHooks.callHookParallel('clear', session.data, event)
  await session.clear()

  return true
}

/**
 * Require a user session
 * @param event
 * @param opts Options to customize the error message and status code
 * @param opts.statusCode The status code to use for the error (defaults to 401)
 * @param opts.message The message to use for the error (defaults to Unauthorized)
 */
export async function requireUserSession(event: H3Event, opts: { statusCode?: number, message?: string } = {}): Promise<UserSessionRequired> {
  const userSession = await getUserSession(event)

  if (!userSession.user) {
    throw createError({
      statusCode: opts.statusCode || 401,
      message: opts.message || 'Unauthorized',
    })
  }

  return userSession as UserSessionRequired
}

let sessionConfig: SessionConfig

function _useSession(event: H3Event) {
  if (!sessionConfig) {
    // TODO: add explanation
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    sessionConfig = defu({ password: process.env.NUXT_SESSION_PASSWORD }, useRuntimeConfig(event).session)
  }
  return useSession<UserSession>(event, sessionConfig)
}

export function getProtocolRequestURL(event: H3Event) {
  const protocol = process.env.NODE_ENV === 'development' ? 'http:' : 'https:'
  const url = getRequestURL(event, { xForwardedProto: true })
  url.protocol = protocol.replace('http', protocol)
  return url
}
