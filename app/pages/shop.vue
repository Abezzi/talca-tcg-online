<template>
  <div class="p-6 bg-gray-900 rounded-xl border border-gray-700">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-white">
        Card Pack
      </h2>
      <div class="text-yellow-400 font-medium">
        {{ auth.coins }} coins
      </div>
    </div>

    <button
      :disabled="auth.coins < 100 || auth.isLoading"
      class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      @click="openPack"
    >
      Buy Pack (100 coins) - 8 cards
    </button>

    <p
      v-if="errorMsg"
      class="mt-3 text-red-400 text-center"
    >
      {{ errorMsg }}
    </p>

    <!-- Show result (add nice animation later) -->
    <div
      v-if="packResult"
      class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      <div
        v-for="card in packResult.allPulled"
        :key="card._id"
        class="p-3 bg-gray-800 rounded-lg border border-gray-700 text-center"
      >
        <div class="font-semibold">
          {{ card.name }}
        </div>
        <div class="text-sm text-gray-400 uppercase">
          {{ card.rarity }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

definePageMeta({
  layout: 'default',
  auth: true,
  middleware: ['auth']
})

const auth = useAuthStore()
</script>
