<script lang="ts" setup>
const drawer = ref(false);
</script>

<template>
  <VApp class="h-full">
    <VNavigationDrawer v-model="drawer">
      <!--  -->
    </VNavigationDrawer>

    <VAppBar>
      <VAppBarNavIcon @click="drawer = !drawer" />
      <VToolbarTitle>Application</VToolbarTitle>
    </VAppBar>

    <VMain class="w-full h-full flex flex-col">
      <RouterView class="px-4" />
    </VMain>
  </VApp>
</template>
