const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const imageGenerator = require('../utils/imageGenerator');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Category data
const categories = [
  {
    name: 'Produce',
    description: 'Fresh fruits and vegetables',
    department: 'Fresh Food'
  },
  {
    name: 'Dairy',
    description: 'Milk, cheese, and other dairy products',
    department: 'Fresh Food'
  },
  {
    name: 'Meat',
    description: 'Fresh and frozen meat products',
    department: 'Fresh Food'
  },
  {
    name: 'Bakery',
    description: 'Bread, pastries, and other baked goods',
    department: 'Fresh Food'
  },
  {
    name: 'Beverages',
    description: 'Drinks including water, juice, soda, and more',
    department: 'Beverages'
  },
  {
    name: 'Snacks',
    description: 'Chips, cookies, and other snack foods',
    department: 'Grocery'
  },
  {
    name: 'Canned Goods',
    description: 'Canned soups, vegetables, and more',
    department: 'Grocery'
  },
  {
    name: 'Personal Care',
    description: 'Hygiene and beauty products',
    department: 'Health & Beauty'
  },
  {
    name: 'Cleaning',
    description: 'Household cleaning supplies',
    department: 'Household'
  }
];

// Product data function - to generate a lot of products
const generateProducts = (categoryMap) => {
    console.log('Generating products...');
    console.log('Category Map:', categoryMap);
    
    const products = [];
    
    // Produce Category
    const produceCategoryId = categoryMap.get('Produce');
    console.log('Produce Category ID:', produceCategoryId);
    
    if (!produceCategoryId) {
      console.error('Failed to find Produce category ID in the map');
      return [];
    }
  
  // Fruits
  products.push(
    {
      name: 'Organic Bananas',
      description: 'Sweet and nutritious organic bananas, perfect for snacking or baking.',
      price: 2.99,
      category: produceCategoryId,
      image: '/images/produce/bananas.jpg',
      ingredients: ['Organic Bananas'],
      nutritionalInfo: {
        calories: 105,
        fat: 0.4,
        carbs: 27,
        protein: 1.3,
        sodium: 1
      },
      stockQuantity: 150,
      isFeatured: true
    },
    {
      name: 'Red Apples',
      description: 'Crisp and sweet red apples, locally sourced and perfect for snacking.',
      price: 3.49,
      category: produceCategoryId,
      image: '/images/produce/apples.jpg',
      ingredients: ['Red Apples'],
      nutritionalInfo: {
        calories: 95,
        fat: 0.3,
        carbs: 25,
        protein: 0.5,
        sodium: 2
      },
      stockQuantity: 200,
      isFeatured: true
    },
    {
      name: 'Strawberries',
      description: 'Sweet and juicy strawberries, perfect for desserts or as a healthy snack.',
      price: 4.99,
      category: produceCategoryId,
      image: '/images/produce/strawberries.jpg',
      ingredients: ['Strawberries'],
      nutritionalInfo: {
        calories: 32,
        fat: 0.3,
        carbs: 7.7,
        protein: 0.7,
        sodium: 1
      },
      stockQuantity: 100,
      isFeatured: false,
      isOnSale: true,
      discountPrice: 3.99
    },
    {
      name: 'Avocado',
      description: 'Ripe avocados, perfect for guacamole or adding to sandwiches and salads.',
      price: 1.99,
      category: produceCategoryId,
      image: '/images/produce/avocado.jpg',
      ingredients: ['Avocado'],
      nutritionalInfo: {
        calories: 240,
        fat: 22,
        carbs: 12.8,
        protein: 3,
        sodium: 10
      },
      stockQuantity: 75,
      isFeatured: false
    }
  );

  // Vegetables
  products.push(
    {
      name: 'Broccoli',
      description: 'Fresh broccoli florets, packed with nutrients and vitamins.',
      price: 2.49,
      category: produceCategoryId,
      image: '/images/produce/broccoli.jpg',
      ingredients: ['Broccoli'],
      nutritionalInfo: {
        calories: 55,
        fat: 0.6,
        carbs: 11.2,
        protein: 3.7,
        sodium: 33
      },
      stockQuantity: 80,
      isFeatured: false
    },
    {
      name: 'Carrots',
      description: 'Crunchy carrots, great for snacking, cooking, or juicing.',
      price: 1.99,
      category: produceCategoryId,
      image: '/images/produce/carrots.jpg',
      ingredients: ['Carrots'],
      nutritionalInfo: {
        calories: 41,
        fat: 0.2,
        carbs: 9.6,
        protein: 0.9,
        sodium: 69
      },
      stockQuantity: 120,
      isFeatured: false,
      isOnSale: true,
      discountPrice: 1.49
    },
    {
      name: 'Spinach',
      description: 'Fresh spinach leaves, perfect for salads, smoothies, or cooking.',
      price: 3.99,
      category: produceCategoryId,
      image: '/images/produce/spinach.jpg',
      ingredients: ['Spinach'],
      nutritionalInfo: {
        calories: 23,
        fat: 0.4,
        carbs: 3.6,
        protein: 2.9,
        sodium: 79
      },
      stockQuantity: 60,
      isFeatured: false
    }
  );

  // Dairy Category
  const dairyCategoryId = categoryMap.get('Dairy');
  
  products.push(
    {
      name: 'Whole Milk',
      description: 'Fresh whole milk, pasteurized and homogenized for great taste.',
      price: 3.49,
      category: dairyCategoryId,
      image: '/images/dairy/milk.jpg',
      ingredients: ['Milk'],
      nutritionalInfo: {
        calories: 150,
        fat: 8,
        carbs: 12,
        protein: 8,
        sodium: 100
      },
      stockQuantity: 100,
      isFeatured: true
    },
    {
      name: 'Greek Yogurt',
      description: 'Creamy Greek yogurt, high in protein and perfect for breakfast or snacking.',
      price: 4.99,
      category: dairyCategoryId,
      image: '/images/dairy/greek-yogurt.jpg',
      ingredients: ['Milk', 'Live Active Cultures'],
      nutritionalInfo: {
        calories: 100,
        fat: 0,
        carbs: 6,
        protein: 18,
        sodium: 55
      },
      stockQuantity: 75,
      isFeatured: false,
      isOnSale: true,
      discountPrice: 3.99
    },
    {
      name: 'Cheddar Cheese',
      description: 'Sharp cheddar cheese, perfect for sandwiches, burgers, or snacking.',
      price: 5.99,
      category: dairyCategoryId,
      image: '/images/dairy/cheddar.jpg',
      ingredients: ['Milk', 'Salt', 'Enzymes'],
      nutritionalInfo: {
        calories: 110,
        fat: 9,
        carbs: 0.5,
        protein: 7,
        sodium: 180
      },
      stockQuantity: 90,
      isFeatured: false
    },
    {
      name: 'Butter',
      description: 'Creamy butter, perfect for cooking, baking, or spreading on toast.',
      price: 4.49,
      category: dairyCategoryId,
      image: '/images/dairy/butter.jpg',
      ingredients: ['Cream', 'Salt'],
      nutritionalInfo: {
        calories: 100,
        fat: 11,
        carbs: 0,
        protein: 0,
        sodium: 90
      },
      stockQuantity: 80,
      isFeatured: false
    }
  );

  // Meat Category
  const meatCategoryId = categoryMap.get('Meat');
  
  products.push(
    {
      name: 'Chicken Breast',
      description: 'Boneless, skinless chicken breasts, perfect for grilling, baking, or sautéing.',
      price: 8.99,
      category: meatCategoryId,
      image: '/images/meat/chicken-breast.jpg',
      ingredients: ['Chicken'],
      nutritionalInfo: {
        calories: 165,
        fat: 3.6,
        carbs: 0,
        protein: 31,
        sodium: 74
      },
      stockQuantity: 60,
      isFeatured: true
    },
    {
      name: 'Ground Beef',
      description: '85% lean ground beef, perfect for burgers, meatballs, or tacos.',
      price: 7.99,
      category: meatCategoryId,
      image: '/images/meat/ground-beef.jpg',
      ingredients: ['Beef'],
      nutritionalInfo: {
        calories: 250,
        fat: 15,
        carbs: 0,
        protein: 26,
        sodium: 80
      },
      stockQuantity: 50,
      isFeatured: false,
      isOnSale: true,
      discountPrice: 6.99
    },
    {
      name: 'Salmon Fillet',
      description: 'Fresh Atlantic salmon fillets, rich in omega-3 fatty acids.',
      price: 12.99,
      category: meatCategoryId,
      image: '/images/meat/salmon.jpg',
      ingredients: ['Salmon'],
      nutritionalInfo: {
        calories: 208,
        fat: 13,
        carbs: 0,
        protein: 22,
        sodium: 59
      },
      stockQuantity: 40,
      isFeatured: true
    },
    {
      name: 'Pork Chops',
      description: 'Tender pork chops, perfect for grilling or pan-frying.',
      price: 6.99,
      category: meatCategoryId,
      image: '/images/meat/pork-chops.jpg',
      ingredients: ['Pork'],
      nutritionalInfo: {
        calories: 198,
        fat: 11,
        carbs: 0,
        protein: 23,
        sodium: 54
      },
      stockQuantity: 45,
      isFeatured: false
    }
  );

  // Bakery Category
  const bakeryCategoryId = categoryMap.get('Bakery');
  
  products.push(
    {
      name: 'Whole Wheat Bread',
      description: 'Freshly baked whole wheat bread, perfect for sandwiches or toast.',
      price: 4.29,
      category: bakeryCategoryId,
      image: '/images/bakery/whole-wheat-bread.jpg',
      ingredients: ['Whole Wheat Flour', 'Water', 'Yeast', 'Salt', 'Sugar'],
      nutritionalInfo: {
        calories: 80,
        fat: 1,
        carbs: 15,
        protein: 3,
        sodium: 160
      },
      stockQuantity: 30,
      isFeatured: false
    },
    {
      name: 'Bagels',
      description: 'Freshly baked plain bagels, perfect for breakfast or sandwiches.',
      price: 5.99,
      category: bakeryCategoryId,
      image: '/images/bakery/bagels.jpg',
      ingredients: ['Flour', 'Water', 'Malt', 'Salt', 'Yeast'],
      nutritionalInfo: {
        calories: 270,
        fat: 1.5,
        carbs: 53,
        protein: 9,
        sodium: 430
      },
      stockQuantity: 24,
      isFeatured: false
    },
    {
      name: 'Croissants',
      description: 'Buttery, flaky croissants, freshly baked and perfect for breakfast.',
      price: 6.99,
      category: bakeryCategoryId,
      image: '/images/bakery/croissants.jpg',
      ingredients: ['Flour', 'Butter', 'Sugar', 'Salt', 'Yeast'],
      nutritionalInfo: {
        calories: 260,
        fat: 14,
        carbs: 26,
        protein: 5,
        sodium: 190
      },
      stockQuantity: 20,
      isFeatured: true,
      isOnSale: true,
      discountPrice: 5.49
    }
  );

  // Beverages Category
  const beveragesCategoryId = categoryMap.get('Beverages');
  
  products.push(
    {
      name: 'Orange Juice',
      description: 'Freshly squeezed orange juice, rich in vitamin C.',
      price: 4.99,
      category: beveragesCategoryId,
      image: '/images/beverages/orange-juice.jpg',
      ingredients: ['Oranges'],
      nutritionalInfo: {
        calories: 110,
        fat: 0,
        carbs: 26,
        protein: 2,
        sodium: 0
      },
      stockQuantity: 40,
      isFeatured: false
    },
    {
      name: 'Spring Water',
      description: 'Pure spring water, refreshing and hydrating.',
      price: 1.49,
      category: beveragesCategoryId,
      image: '/images/beverages/water.jpg',
      ingredients: ['Water'],
      nutritionalInfo: {
        calories: 0,
        fat: 0,
        carbs: 0,
        protein: 0,
        sodium: 0
      },
      stockQuantity: 200,
      isFeatured: false,
      isOnSale: true,
      discountPrice: 0.99
    },
    {
      name: 'Green Tea',
      description: 'Organic green tea bags, rich in antioxidants.',
      price: 5.99,
      category: beveragesCategoryId,
      image: '/images/beverages/green-tea.jpg',
      ingredients: ['Organic Green Tea Leaves'],
      nutritionalInfo: {
        calories: 0,
        fat: 0,
        carbs: 0,
        protein: 0,
        sodium: 0
      },
      stockQuantity: 60,
      isFeatured: false
    },
    {
      name: 'Coffee Beans',
      description: 'Premium coffee beans, freshly roasted for a rich, full-bodied flavor.',
      price: 9.99,
      category: beveragesCategoryId,
      image: '/images/beverages/coffee.jpg',
      ingredients: ['100% Arabica Coffee Beans'],
      nutritionalInfo: {
        calories: 0,
        fat: 0,
        carbs: 0,
        protein: 0,
        sodium: 0
      },
      stockQuantity: 35,
      isFeatured: true
    }
  );

  // Snacks Category
  const snacksCategoryId = categoryMap.get('Snacks');
  
  products.push(
    {
      name: 'Potato Chips',
      description: 'Crispy potato chips, lightly salted for a perfect snack.',
      price: 3.49,
      category: snacksCategoryId,
      image: '/images/snacks/potato-chips.jpg',
      ingredients: ['Potatoes', 'Vegetable Oil', 'Salt'],
      nutritionalInfo: {
        calories: 150,
        fat: 10,
        carbs: 15,
        protein: 2,
        sodium: 180
      },
      stockQuantity: 100,
      isFeatured: false
    },
    {
      name: 'Chocolate Cookies',
      description: 'Delicious chocolate chip cookies, perfect for dessert or a sweet treat.',
      price: 4.99,
      category: snacksCategoryId,
      image: '/images/snacks/chocolate-cookies.jpg',
      ingredients: ['Flour', 'Sugar', 'Butter', 'Chocolate Chips', 'Eggs'],
      nutritionalInfo: {
        calories: 160,
        fat: 8,
        carbs: 21,
        protein: 2,
        sodium: 110
      },
      stockQuantity: 50,
      isFeatured: true,
      isOnSale: true,
      discountPrice: 3.99
    },
    {
      name: 'Mixed Nuts',
      description: 'A nutritious blend of almonds, cashews, and walnuts, perfect for snacking.',
      price: 7.99,
      category: snacksCategoryId,
      image: '/images/snacks/mixed-nuts.jpg',
      ingredients: ['Almonds', 'Cashews', 'Walnuts', 'Salt'],
      nutritionalInfo: {
        calories: 170,
        fat: 15,
        carbs: 7,
        protein: 5,
        sodium: 95
      },
      stockQuantity: 40,
      isFeatured: false
    }
  );
  
  // Canned Goods Category
  const cannedCategoryId = categoryMap.get('Canned Goods');
  
  products.push(
    {
      name: 'Canned Tuna',
      description: 'Chunk light tuna in water, a convenient source of protein.',
      price: 1.99,
      category: cannedCategoryId,
      image: '/images/canned/tuna.jpg',
      ingredients: ['Tuna', 'Water', 'Salt'],
      nutritionalInfo: {
        calories: 70,
        fat: 0.5,
        carbs: 0,
        protein: 16,
        sodium: 250
      },
      stockQuantity: 120,
      isFeatured: false
    },
    {
      name: 'Canned Soup',
      description: 'Hearty vegetable soup, perfect for a quick and convenient meal.',
      price: 2.49,
      category: cannedCategoryId,
      image: '/images/canned/soup.jpg',
      ingredients: ['Water', 'Carrots', 'Potatoes', 'Peas', 'Salt', 'Spices'],
      nutritionalInfo: {
        calories: 90,
        fat: 2,
        carbs: 15,
        protein: 3,
        sodium: 480
      },
      stockQuantity: 80,
      isFeatured: false,
      isOnSale: true,
      discountPrice: 1.99
    },
    {
      name: 'Canned Beans',
      description: 'Black beans, a versatile and nutritious addition to many dishes.',
      price: 1.29,
      category: cannedCategoryId,
      image: '/images/canned/beans.jpg',
      ingredients: ['Black Beans', 'Water', 'Salt'],
      nutritionalInfo: {
        calories: 110,
        fat: 0,
        carbs: 20,
        protein: 7,
        sodium: 360
      },
      stockQuantity: 150,
      isFeatured: false
    }
  );

  // Personal Care Category
  const personalCareCategoryId = categoryMap.get('Personal Care');
  
  products.push(
    {
      name: 'Shampoo',
      description: 'Gentle, moisturizing shampoo for all hair types.',
      price: 6.99,
      category: personalCareCategoryId,
      image: '/images/personal-care/shampoo.jpg',
      ingredients: ['Water', 'Sodium Laureth Sulfate', 'Cocamidopropyl Betaine', 'Fragrance'],
      stockQuantity: 50,
      isFeatured: false
    },
    {
      name: 'Toothpaste',
      description: 'Mint-flavored toothpaste with fluoride for cavity protection.',
      price: 3.99,
      category: personalCareCategoryId,
      image: '/images/personal-care/toothpaste.jpg',
      ingredients: ['Sodium Fluoride', 'Sorbitol', 'Hydrated Silica', 'Flavoring'],
      stockQuantity: 70,
      isFeatured: false,
      isOnSale: true,
      discountPrice: 2.99
    },
    {
      name: 'Hand Soap',
      description: 'Moisturizing hand soap that cleans and nourishes.',
      price: 4.49,
      category: personalCareCategoryId,
      image: '/images/personal-care/hand-soap.jpg',
      ingredients: ['Water', 'Sodium Laureth Sulfate', 'Glycerin', 'Fragrance'],
      stockQuantity: 60,
      isFeatured: false
    }
  );

  // Cleaning Category
  const cleaningCategoryId = categoryMap.get('Cleaning');
  
  products.push(
    {
      name: 'All-Purpose Cleaner',
      description: 'Versatile cleaner for kitchen, bathroom, and other surfaces.',
      price: 4.99,
      category: cleaningCategoryId,
      image: '/images/cleaning/all-purpose.jpg',
      ingredients: ['Water', 'Alcohol Ethoxylate', 'Sodium Citrate', 'Fragrance'],
      stockQuantity: 40,
      isFeatured: false
    },
    {
      name: 'Dish Soap',
      description: 'Effective dish soap that cuts through grease and food residue.',
      price: 3.49,
      category: cleaningCategoryId,
      image: '/images/cleaning/dish-soap.jpg',
      ingredients: ['Water', 'Sodium Lauryl Sulfate', 'Sodium Laureth Sulfate', 'Fragrance'],
      stockQuantity: 55,
      isFeatured: false,
      isOnSale: true,
      discountPrice: 2.99
    },
    {
      name: 'Laundry Detergent',
      description: 'Powerful detergent for clean, fresh-smelling clothes.',
      price: 8.99,
      category: cleaningCategoryId,
      image: '/images/cleaning/laundry.jpg',
      ingredients: ['Surfactants', 'Enzymes', 'Fragrance', 'Brighteners'],
      stockQuantity: 30,
      isFeatured: false
    }
  );

  console.log(`Generated ${products.length} products`);
  return products;
};

// Promotion data function - based on products
const generatePromotions = (productMap) => {
    console.log('Generating promotions...');
    console.log('Product Map:', productMap);
    
    const currentDate = new Date();
    const oneWeekFromNow = new Date(currentDate);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  
    const oneMonthFromNow = new Date(currentDate);
    oneMonthFromNow.setDate(oneMonthFromNow.getDate() + 30);

    const promotions = [
        {
          title: 'Summer Fruit Sale',
          description: 'Get 20% off on selected fresh fruits',
          discountPercent: 20,
          startDate: currentDate,
          endDate: oneMonthFromNow,
          isActive: true,
          applicableProducts: [
            productMap.get('Strawberries'),
            productMap.get('Red Apples')
          ]
        },
        {
          title: 'Dairy Week',
          description: 'Save on dairy products this week only',
          discountPercent: 15,
          startDate: currentDate,
          endDate: oneWeekFromNow,
          isActive: true,
          applicableProducts: [
            productMap.get('Greek Yogurt'),
            productMap.get('Whole Milk')
          ]
        }
      ];
      
      console.log(`Generated ${promotions.length} promotions`);
      return promotions;
};

// Create output directory for images if it doesn't exist
// Create output directory for images if it doesn't exist
const createImageDirectories = () => {
    const imageDir = path.join(__dirname, '../../../frontend/public/images');
    
    // Create main images directory
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
        try {
          fs.mkdirSync(fullPath, { recursive: true });
          console.log(`Created directory: ${fullPath}`);
        } catch (err) {
          console.error(`Error creating directory ${fullPath}:`, err);
        }
      } else {
        console.log(`Directory already exists: ${fullPath}`);
      }
    });
    
    console.log('Image directories created');
    return imageDir;
  };
  

// Main function to seed database
const seedDB = async () => {
    try {
      console.log('Starting database seeding process...');
      
      // Connect to database
      await connectDB();
      
      // Create image directories
      const imageDir = createImageDirectories();
      console.log(`Created image directories at: ${imageDir}`);
      
      // Clear existing data
      await Category.deleteMany({});
      console.log('Categories cleared');
      
      await Product.deleteMany({});
      console.log('Products cleared');
      
      await Promotion.deleteMany({});
      console.log('Promotions cleared');
      
      // Insert categories
      const insertedCategories = await Category.insertMany(categories);
      console.log(`${insertedCategories.length} categories created`);
      
      // Create a map to easily reference categories by name
      const categoryMap = new Map();
      insertedCategories.forEach(category => {
        categoryMap.set(category.name, category._id);
      });
      
      // Generate and insert products
      const productsToInsert = generateProducts(categoryMap);
      
      if (productsToInsert.length === 0) {
        console.error('No products generated. Check the generateProducts function.');
        process.exit(1);
      }
      
      const insertedProducts = await Product.insertMany(productsToInsert);
      console.log(`${insertedProducts.length} products created`);
      
      // Create a map to easily reference products by name
      const productMap = new Map();
      insertedProducts.forEach(product => {
        productMap.set(product.name, product._id);
      });
      
      // Generate and insert promotions
      const promotionsToInsert = generatePromotions(productMap);
      
      if (promotionsToInsert.length === 0) {
        console.error('No promotions generated. Check the generatePromotions function.');
        process.exit(1);
      }
      
      const insertedPromotions = await Promotion.insertMany(promotionsToInsert);
      console.log(`${insertedPromotions.length} promotions created`);

      await imageGenerator.generateProductImages(path.join(__dirname, '../../../frontend'));
      console.log('Product images generated');

      
      console.log('Database seeded successfully!');
      process.exit(0);
    } catch (error) {
      console.error(`Error in seedDB function: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    }
  };
  
  // Run the seeder
  console.log('Seed script started');
  seedDB();