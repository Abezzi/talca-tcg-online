<script setup lang="ts">
definePageMeta({
  layout: 'guest'
})
const { loggedIn } = useUserSession()

// Auto-redirect if already logged in
if (loggedIn.value) {
  await navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-800 transition-colors duration-300">
    <div class="w-full max-w-md px-6 py-12">
      <!-- Card -->
      <UCard
        :ui="{
          base: 'overflow-hidden',
          ring: '',
          divide: 'divide-y divide-gray-200 dark:divide-gray-800',
          header: { padding: '' },
          body: { base: 'space-y-6', padding: 'px-6 py-8' },
          footer: { padding: '' }
        }"
      >
        <!-- Header -->
        <template #header>
          <div class="text-center">
            <AppLogo class="mx-auto h-12 w-auto text-primary" />
            <h1 class="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Talca TCG
            </h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in to start playing!
            </p>
          </div>
        </template>

        <!-- Discord Button -->
        <UButton
          block
          external
          to="/auth/discord"
          color="indigo"
          size="xl"
          icon="i-simple-icons-discord"
          class="shadow-lg hover:shadow-xl transition-shadow"
        >
          Sign in with Discord
        </UButton>

        <!-- Divider -->
        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-white dark:bg-gray-950 px-4 text-gray-500">
              or continue with email
            </span>
          </div>
        </div>

        <!-- Placeholder for future email login form -->
        <p class="text-center text-sm text-gray-600 dark:text-gray-400">
          Email login coming soon™
        </p>
      </UCard>
    </div>
  </div>
</template>
