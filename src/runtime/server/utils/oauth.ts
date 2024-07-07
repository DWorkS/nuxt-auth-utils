import { githubEventHandler } from '../lib/oauth/github'
import { googleEventHandler } from '../lib/oauth/google'
import { auth0EventHandler } from '../lib/oauth/auth0'
import { microsoftEventHandler } from '../lib/oauth/microsoft'
import { linkedinEventHandler } from '../lib/oauth/linkedin'
import { facebookEventHandler } from '../lib/oauth/facebook'

export const oauth = {
  githubEventHandler,
  googleEventHandler,
  auth0EventHandler,
  microsoftEventHandler,
  linkedinEventHandler,
  facebookEventHandler,
}
