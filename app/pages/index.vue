<script setup>
definePageMeta({
  layout: 'default',
  middleware: ['auth']
})

const { user, clear: clearSession } = useUserSession()
async function logout() {
  await clearSession()
  await nagivateTo('/login')
}
</script>

<template>
  <div>
    <h1 className="text-5xl">
      welcome, {{ user }}
    </h1>
    <button @click="logout">
      Logout
    </button>
  </div>
</template>
