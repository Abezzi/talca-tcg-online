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

        <UDropdownMenu
          v-if="loggedIn"
          :items="userMenuItems"
        >
          <UButton
            color="neutral"
            variant="ghost"
          >
            <UAvatar
              :src="user.avatar"
              :alt="user.globalName || user.username"
              size="sm"
            />
            <span class="text-sm font-medium hidden sm:block">
              {{ user.globalName || user.username }}
            </span>
          </UButton>
        </UDropdownMenu>
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
      <slot />
      <!-- <NuxtPage /> -->
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

const { loggedIn, clear, user } = useUserSession()

const logout = async () => {
  await clear()
  navigateTo('/login')
}

const route = useRoute()
// user dropdown items
const userMenuItems = computed<DropdownItem[]>(() => [
  {
    label: user.value?.displayName || user.value?.username || 'User',
    disabled: true,
    icon: 'i-heroicons-user-circle',
    class: 'font-medium text-gray-900 dark:text-white'
  },
  {
    type: 'divider'
  },
  {
    label: 'Logout',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    onSelect: logout,
    class: 'text-red-600 dark:text-red-400'
  }
])

// header items in the middle
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
