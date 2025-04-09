// backend/src/utils/imageGenerator.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');

/**
 * Creates placeholder images for products
 * @param {string} baseDir - Base directory for the frontend public folder
 */
async function generateProductImages(baseDir) {
  console.log('Generating product images...');
  
  // Ensure the images directory exists
  const imageDir = path.join(baseDir, 'public/images');
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }
  
  // Create subdirectories for each category
  const subdirs = [
    'produce', 
    'dairy', 
    'meat', 
    'bakery', 
    'beverages', 
    'snacks', 
    'canned', 
    'personal-care', 
    'cleaning'
  ];
  
  subdirs.forEach(dir => {
    const fullPath = path.join(imageDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // Generate or download images for each product
  try {
    // Produce images
    await generateCategoryImages('produce', [
      { filename: 'bananas.jpg', keyword: 'bananas' },
      { filename: 'apples.jpg', keyword: 'red apples' },
      { filename: 'strawberries.jpg', keyword: 'strawberries' },
      { filename: 'avocado.jpg', keyword: 'avocado' },
      { filename: 'broccoli.jpg', keyword: 'broccoli' },
      { filename: 'carrots.jpg', keyword: 'carrots' },
      { filename: 'spinach.jpg', keyword: 'spinach' }
    ], imageDir);

    // Dairy images
    await generateCategoryImages('dairy', [
      { filename: 'milk.jpg', keyword: 'milk bottle' },
      { filename: 'greek-yogurt.jpg', keyword: 'greek yogurt' },
      { filename: 'cheddar.jpg', keyword: 'cheddar cheese' },
      { filename: 'butter.jpg', keyword: 'butter' }
    ], imageDir);

    // Meat images
    await generateCategoryImages('meat', [
      { filename: 'chicken-breast.jpg', keyword: 'chicken breast' },
      { filename: 'ground-beef.jpg', keyword: 'ground beef' },
      { filename: 'salmon.jpg', keyword: 'salmon fillet' },
      { filename: 'pork-chops.jpg', keyword: 'pork chops' }
    ], imageDir);

    // Bakery images
    await generateCategoryImages('bakery', [
      { filename: 'whole-wheat-bread.jpg', keyword: 'whole wheat bread' },
      { filename: 'bagels.jpg', keyword: 'bagels' },
      { filename: 'croissants.jpg', keyword: 'croissants' }
    ], imageDir);

    // Beverages images
    await generateCategoryImages('beverages', [
      { filename: 'orange-juice.jpg', keyword: 'orange juice' },
      { filename: 'water.jpg', keyword: 'bottled water' },
      { filename: 'green-tea.jpg', keyword: 'green tea' },
      { filename: 'coffee.jpg', keyword: 'coffee beans' }
    ], imageDir);

    // Snacks images
    await generateCategoryImages('snacks', [
      { filename: 'potato-chips.jpg', keyword: 'potato chips' },
      { filename: 'chocolate-cookies.jpg', keyword: 'chocolate cookies' },
      { filename: 'mixed-nuts.jpg', keyword: 'mixed nuts' }
    ], imageDir);

    // Canned goods images
    await generateCategoryImages('canned', [
      { filename: 'tuna.jpg', keyword: 'canned tuna' },
      { filename: 'soup.jpg', keyword: 'canned soup' },
      { filename: 'beans.jpg', keyword: 'canned beans' }
    ], imageDir);

    // Personal care images
    await generateCategoryImages('personal-care', [
      { filename: 'shampoo.jpg', keyword: 'shampoo bottle' },
      { filename: 'toothpaste.jpg', keyword: 'toothpaste' },
      { filename: 'hand-soap.jpg', keyword: 'hand soap' }
    ], imageDir);

    // Cleaning images
    await generateCategoryImages('cleaning', [
      { filename: 'all-purpose.jpg', keyword: 'all purpose cleaner' },
      { filename: 'dish-soap.jpg', keyword: 'dish soap' },
      { filename: 'laundry.jpg', keyword: 'laundry detergent' }
    ], imageDir);

    // Generate a default product image
    await generatePlaceholderImage(path.join(imageDir, 'default-product.png'), 400, 400);

    console.log('All product images generated successfully!');
  } catch (error) {
    console.error('Error generating product images:', error);
  }
}

/**
 * Generate images for a product category
 * @param {string} category - Category name
 * @param {Array} products - Array of product image details
 * @param {string} baseDir - Base directory for images
 */
async function generateCategoryImages(category, products, baseDir) {
  console.log(`Generating images for ${category} category...`);
  
  for (const product of products) {
    const imagePath = path.join(baseDir, category, product.filename);
    
    // Try to download from Unsplash first
    try {
      await downloadUnsplashImage(product.keyword, imagePath);
      console.log(`Downloaded image for ${product.filename}`);
    } catch (error) {
      // If Unsplash fails, create a placeholder
      console.log(`Falling back to placeholder for ${product.filename}`);
      await generatePlaceholderImage(imagePath, 400, 400, product.keyword);
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Download an image from Unsplash based on a keyword
 * @param {string} keyword - Search keyword
 * @param {string} outputPath - Path to save the image
 */
async function downloadUnsplashImage(keyword, outputPath) {
  try {
    // Use Unsplash Source API for simple image retrieval
    // Note: This is rate-limited and for development purposes only
    const url = `https://source.unsplash.com/featured/?grocery,${encodeURIComponent(keyword)}&w=400&h=400`;
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer'
    });
    
    // Resize and optimize the image
    await sharp(response.data)
      .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    console.error(`Error downloading image for ${keyword}:`, error.message);
    throw error;
  }
}

/**
 * Alternative method: Create a fallback function that uses Pixabay API
 * You'll need to register for a free API key at https://pixabay.com/api/docs/
 * @param {string} keyword - Search keyword
 * @param {string} outputPath - Path to save the image
 */
async function downloadPixabayImage(keyword, outputPath) {
  try {
    // Replace with your own Pixabay API key
    const apiKey = 'YOUR_PIXABAY_API_KEY';
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(keyword)}&image_type=photo&orientation=horizontal&per_page=3`;
    
    const response = await axios.get(url);
    
    if (response.data.hits && response.data.hits.length > 0) {
      const imageUrl = response.data.hits[0].webformatURL;
      
      // Download the image
      const imageResponse = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'arraybuffer'
      });
      
      // Resize and optimize
      await sharp(imageResponse.data)
        .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
      
      return true;
    } else {
      throw new Error('No images found on Pixabay');
    }
  } catch (error) {
    console.error(`Error downloading Pixabay image for ${keyword}:`, error.message);
    throw error;
  }
}

/**
 * Generate a placeholder image with text
 * @param {string} outputPath - Path to save the image
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Optional text to display on the image
 */
async function generatePlaceholderImage(outputPath, width = 400, height = 400, text = '') {
  try {
    // Create a blank canvas with a light background
    const svgImage = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8f9fa"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#6c757d" text-anchor="middle" dominant-baseline="middle">
        ${text || 'Product Image'}
      </text>
    </svg>
    `;
    
    await sharp(Buffer.from(svgImage))
      .resize(width, height)
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    console.error('Error generating placeholder image:', error);
    throw error;
  }
}

/**
 * Alternative method: Generate colorful placeholder with product name
 * This creates more visually distinct placeholders based on product name
 * @param {string} outputPath - Path to save the image
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} productName - Product name for text and color generation
 */
async function generateColorfulPlaceholder(outputPath, width = 400, height = 400, productName = 'Product') {
  try {
    // Generate a color based on the product name (simple hash)
    const hash = productName.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const hue = hash % 360;
    const color = `hsl(${hue}, 70%, 80%)`;
    const textColor = `hsl(${hue}, 70%, 30%)`;

    // Create a colorful svg placeholder
    const svgImage = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
        ${productName}
      </text>
    </svg>
    `;
    
    await sharp(Buffer.from(svgImage))
      .resize(width, height)
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    console.error('Error generating colorful placeholder:', error);
    throw error;
  }
}

module.exports = {
  generateProductImages
};