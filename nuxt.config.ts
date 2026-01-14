// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // imports modules
  modules: [
    '@nuxt/a11y',
    '@nuxt/eslint',
    '@nuxt/hints',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxt/ui',
    'convex-nuxt'
  ],

  // will use router based of pages/, instead of only the app.vue file
  pages: true,
  devtools: { enabled: true },

  // imports the css
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',

  // convex config
  convex: {
    url: process.env.CONVEX_URL
  },

  // eslint config
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // font families and their providers
  fonts: {
    families: [
      {
        name: 'Comico',
        provider: 'fontshare'
      }
    ]
  }
})
