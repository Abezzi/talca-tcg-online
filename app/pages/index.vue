<script setup>
definePageMeta({
  layout: 'default',
  auth: true,
  middleware: ['auth']
})

const { user } = useUserSession()
</script>

<template>
  <div>
    <h1 className="text-5xl">
      welcome, {{ user }}
    </h1>
  </div>
</template>
