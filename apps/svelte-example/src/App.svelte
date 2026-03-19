<script lang="ts">
  import { createWebHaptics } from "web-haptics/svelte";

  const { trigger } = createWebHaptics();
</script>

<div class="container">
  <button on:click={() => trigger()}>Tap me</button>
</div>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 2rem;
  }
</style>
