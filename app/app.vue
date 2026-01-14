<template>
  <UApp>
    <UHeader
      title="Talca TCG"
      mode="slideover"
    >
      <!-- Logo -->
      <template #left>
        <NuxtLink to="/">
          <div className="flex flex-row">
            <AppLogo class="w-auto h-6 shrink-0 mr-2" />
            <p className="text-2xl">Talca TCG</p>
          </div>
        </NuxtLink>
      </template>

      <!-- Items -->
      <UNavigationMenu :items="items" />

      <!-- Right side buttons -->
      <template #right>
        <UColorModeButton />

        <UButton
          to="https://github.com/abezzi/talca-tcg-online"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>

      <template #body>
        <UNavigationMenu
          :items="items"
          orientation="vertical"
          class="-mx-2.5"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          By Sandiapps • © {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <UButton
          to="https://sandiapps.cl"
          target="_blank"
          icon="tdesign-watermelon"
          aria-label="Sandiapps"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Decks',
    to: '/deck',
    icon: 'picon-stack',
    active: route.path.startsWith('/docs/components')
  },
  {
    label: 'Shop',
    icon: 'i-lucide-shopping-cart',
    to: '/shop',
    active: route.path.startsWith('/docs/components')
  },
  {
    label: 'Play',
    icon: 'i-lucide-play',
    to: '/play',
    active: route.path.startsWith('/docs/components')
  },
  {
    label: 'Docs',
    to: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    icon: 'i-lucide-book-open',
    target: '_blank'
  }
])
</script>
