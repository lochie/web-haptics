<template>
  <div class="container">
    <button @click="trigger()">Tap me</button>
  </div>
</template>

<script setup lang="ts">
import { trigger } from "web-haptics";
</script>

<style>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 2rem;
}
</style>
