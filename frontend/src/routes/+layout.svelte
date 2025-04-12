<script>
  import "../app.postcss";
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  
  onMount(() => {
    // Initialize auth state
    authStore.init();
  });
</script>
  
<slot />