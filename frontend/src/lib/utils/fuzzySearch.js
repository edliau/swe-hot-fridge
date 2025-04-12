import Fuse from 'fuse.js';

/**
 * Fuzzy search products by name with suggestions
 * @param {string} query - Search query
 * @param {Array} products - All products
 * @returns {Object} { matches: [], suggestions: [] }
 */
export function fuzzySearchProducts(query, products) {
  const fuse = new Fuse(products, {
    keys: ['name'],
    threshold: 0.2,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  const results = fuse.search(query);
  const matches = results.map(r => r.item);
  
  // Suggest alternative names if low match
  const suggestions = results
    .filter(r => r.score > 0.3 && r.score <= 0.6) // not exact but close
    .map(r => r.item.name);

  return { matches, suggestions };
}
