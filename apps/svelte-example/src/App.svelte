<script lang="ts">
  import { trigger } from 'web-haptics';
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
