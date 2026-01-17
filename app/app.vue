<template>
  <div
    v-if="authStore.isLoading"
    class="min-h-screen flex items-center justify-center bg-zinc-900"
  >
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
  </div>

  <NuxtLayout v-else>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>
