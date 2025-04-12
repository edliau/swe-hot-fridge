<script>
    import { onMount } from 'svelte';
    import { authStore } from '$lib/stores/auth';
    import { favoritesAPI } from '$lib/api';
    import ProductCard from '$lib/components/ProductCard.svelte';
  
    let favouriteProducts = [];
    let filteredFavourites = [];
    let searchInput = '';
    let isLoading = true;
    let errorMessage = '';
    let isAuthenticated;
  
    $: isAuthenticated = $authStore.isAuthenticated;
  
    // Filter the favourites as the user types
    $: filteredFavourites = favouriteProducts.filter(p =>
      p.name.toLowerCase().includes(searchInput.toLowerCase())
    );
  
    onMount(async () => {
      try {
        isLoading = true;
        const res = await favoritesAPI.getFavorites();
        favouriteProducts = res.data || [];
      } catch (e) {
        errorMessage = 'Could not load favourites.';
        console.error(e);
      } finally {
        isLoading = false;
      }
    });
  </script>
  
  <main class="p-6 bg-white min-h-[calc(100vh-200px)]">
    <h2 class="text-2xl font-bold mb-6">My Favourites</h2>
  
    <!-- Search bar -->
    <form on:submit|preventDefault class="mb-6">
      <div class="relative">
        <input
          type="text"
          bind:value={searchInput}
          placeholder="Search your favourites"
          class="w-full rounded-full py-2 px-10 border-2 border-gray-300 focus:outline-none"
        />
        <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </form>
  
    {#if isLoading}
      <div class="text-center text-gray-500">Loading...</div>
    {:else if errorMessage}
      <div class="text-center text-red-500">{errorMessage}</div>
    {:else if filteredFavourites.length > 0}
      <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
        {#each filteredFavourites as product}
          <ProductCard {product} />
        {/each}
      </div>
    {:else}
      <div class="text-center text-gray-500">
        <p>No matching favourites found for "{searchInput}".</p>
      </div>
    {/if}
  </main>
  