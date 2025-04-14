<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
  
    let searchQuery = '';
  
    // Pre-fill if you're already on /search?q=...
    $: currentQuery = $page.url.searchParams.get('q');
  
    onMount(() => {
      if (currentQuery) searchQuery = currentQuery;
    });
  
    function handleSearch() {
      if (searchQuery.trim()) {
        goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  </script>
  
  <form on:submit|preventDefault={handleSearch}>
    <div class="relative">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search for products"
        class="w-full rounded-full py-2 px-10 border-2 border-gray-300 focus:outline-none"
      />
      <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  </form>
  