<script lang="ts" setup>
import { useTheme } from 'vuetify';

useHead({
  title: 'Vuetify3 with CSP example',
});

const { VITE_CONTENT_SECURITY_POLICY } = import.meta.env;

const theme = useTheme();

const toggleTheme = () =>
  (theme.global.name.value = theme.global.current.value.dark
    ? 'light'
    : 'dark');
</script>

<template>
  <VContainer>
    <div class="flex flex-col gap-y-4">
      <div>Current theme: {{ theme.name }}</div>
      <div>
        CSP: <code>{{ VITE_CONTENT_SECURITY_POLICY }}</code>
      </div>
      <VBtn color="primary" @click="toggleTheme">Toggle Theme</VBtn>
    </div>
  </VContainer>
</template>
