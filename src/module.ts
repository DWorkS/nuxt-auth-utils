import { writeFile, readFile } from 'node:fs/promises'
import { defineNuxtModule, addPlugin, createResolver, addImportsDir, addServerHandler, addServerPlugin, addServerImportsDir, addComponentsDir } from '@nuxt/kit'
import { join } from 'pathe'
import { defu } from 'defu'
import { randomUUID } from 'uncrypto'

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'auth-utils',
    configKey: 'auth',
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.alias['#auth-utils'] = resolver.resolve('./runtime/types/index')

    // App
    addComponentsDir({ path: resolver.resolve('./runtime/app/components') })
    addImportsDir(resolver.resolve('./runtime/app/composables'))
    addPlugin(resolver.resolve('./runtime/app/plugins/session.server'))
    addPlugin(resolver.resolve('./runtime/app/plugins/session.client'))
    // Server
    addServerPlugin(resolver.resolve('./runtime/server/plugins/oauth'))
    addServerImportsDir(resolver.resolve('./runtime/server/utils'))
    addServerHandler({
      handler: resolver.resolve('./runtime/server/api/session.delete'),
      route: '/server/_auth/session',
      method: 'delete',
    })
    addServerHandler({
      handler: resolver.resolve('./runtime/server/api/session.get'),
      route: '/server/_auth/session',
      method: 'get',
    })

    // Runtime Config
    const runtimeConfig = nuxt.options.runtimeConfig
    runtimeConfig.session = defu(runtimeConfig.session, {
      name: 'nuxt-session',
      password: process.env.NUXT_SESSION_PASSWORD || '',
      cookie: {
        sameSite: 'lax',
      },
    })

    // Generate the session password
    if (nuxt.options.dev && !runtimeConfig.session.password) {
      runtimeConfig.session.password = randomUUID().replace(/-/g, '')
      // Add it to .env
      const envPath = join(nuxt.options.rootDir, '.env')
      const envContent = await readFile(envPath, 'utf-8').catch(() => '')
      if (!envContent.includes('NUXT_SESSION_PASSWORD')) {
        await writeFile(envPath, `${envContent ? envContent + '\n' : envContent}NUXT_SESSION_PASSWORD=${runtimeConfig.session.password}`, 'utf-8')
      }
    }

    // OAuth settings
    runtimeConfig.oauth = defu(runtimeConfig.oauth, {})
    // GitHub OAuth
    runtimeConfig.oauth.github = defu(runtimeConfig.oauth.github, {
      clientId: '',
      clientSecret: '',
    })
    // Google OAuth
    runtimeConfig.oauth.google = defu(runtimeConfig.oauth.google, {
      clientId: '',
      clientSecret: '',
    })
    // Auth0 OAuth
    runtimeConfig.oauth.auth0 = defu(runtimeConfig.oauth.auth0, {
      clientId: '',
      clientSecret: '',
      domain: '',
      audience: '',
    })
    // Microsoft OAuth
    runtimeConfig.oauth.microsoft = defu(runtimeConfig.oauth.microsoft, {
      clientId: '',
      clientSecret: '',
      tenant: '',
      scope: [],
      authorizationURL: '',
      tokenURL: '',
      userURL: '',
    })
    // LinkedIn OAuth
    runtimeConfig.oauth.linkedin = defu(runtimeConfig.oauth.linkedin, {
      clientId: '',
      clientSecret: '',
    })
    // Facebook OAuth
    runtimeConfig.oauth.facebook = defu(runtimeConfig.oauth.facebook, {
      clientId: '',
      clientSecret: '',
    })
  },
})
