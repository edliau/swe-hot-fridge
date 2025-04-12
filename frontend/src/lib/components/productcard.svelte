<script>
    export let product;
    export let onAddToCart = () => {};
    export let onViewProduct = () => {};
  </script>
  
  <div class="bg-white p-4 rounded-lg shadow-md">
    <button 
      type="button"
      class="w-full h-32 bg-gray-100 mb-3 flex items-center justify-center"
      on:click={() => onViewProduct(product._id)}
      on:keydown={(e) => e.key === 'Enter' && onViewProduct(product._id)}
      aria-label={`View ${product.name} details`}
    >
      {#if product.image}
        <img src={product.image} alt={product.name} class="h-28 object-contain">
      {:else}
        <span class="text-gray-500">{product.name}</span>
      {/if}
    </button>
  
    <h3 class="font-medium text-sm mb-1">{product.name}</h3>
  
    <div class="flex justify-between items-center">
      <div>
        {#if product.isOnSale && product.discountPrice}
          <div class="line-through text-xs text-gray-500">${product.price.toFixed(2)}</div>
          <div class="font-bold text-red-600">${product.discountPrice.toFixed(2)}</div>
        {:else}
          <div class="font-bold">${product.price.toFixed(2)}</div>
        {/if}
      </div>
  
      <button 
        class="bg-pink-400 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-pink-500 transition-colors"
        on:click={() => onAddToCart(product._id)}
        aria-label={`Add ${product.name} to cart`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  </div>
  