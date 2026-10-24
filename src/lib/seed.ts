// Prices are in paise (₹1 = 100).
export const seedCategories = [
  { slug: "fruits-vegetables", name: "Fruits & Vegetables", emoji: "🥦" },
  { slug: "dairy-bread-eggs", name: "Dairy, Bread & Eggs", emoji: "🥛" },
  { slug: "snacks", name: "Snacks & Munchies", emoji: "🍿" },
  { slug: "beverages", name: "Cold Drinks & Juices", emoji: "🥤" },
  { slug: "staples", name: "Atta, Rice & Dal", emoji: "🌾" },
  { slug: "household", name: "Cleaning Essentials", emoji: "🧽" },
  { slug: "personal-care", name: "Personal Care", emoji: "🧴" },
];

export const seedProducts = [
  { category: "fruits-vegetables", name: "Banana (Robusta)", unit: "6 pcs", price: 4900, mrp: 6000, stock: 80, emoji: "🍌" },
  { category: "fruits-vegetables", name: "Tomato (Local)", unit: "500 g", price: 2400, mrp: 3000, stock: 120, emoji: "🍅" },
  { category: "fruits-vegetables", name: "Onion", unit: "1 kg", price: 3900, mrp: 4500, stock: 150, emoji: "🧅" },
  { category: "fruits-vegetables", name: "Apple (Shimla)", unit: "4 pcs", price: 12900, mrp: 15000, stock: 40, emoji: "🍎" },
  { category: "fruits-vegetables", name: "Potato", unit: "1 kg", price: 3500, mrp: 4000, stock: 150, emoji: "🥔" },
  { category: "dairy-bread-eggs", name: "Toned Milk", unit: "500 ml", price: 2700, mrp: 2700, stock: 200, emoji: "🥛" },
  { category: "dairy-bread-eggs", name: "Brown Bread", unit: "400 g", price: 4500, mrp: 5000, stock: 60, emoji: "🍞" },
  { category: "dairy-bread-eggs", name: "Farm Eggs", unit: "6 pcs", price: 5400, mrp: 6000, stock: 90, emoji: "🥚" },
  { category: "dairy-bread-eggs", name: "Paneer", unit: "200 g", price: 9000, mrp: 9500, stock: 50, emoji: "🧀" },
  { category: "dairy-bread-eggs", name: "Curd", unit: "400 g", price: 3500, mrp: 4000, stock: 70, emoji: "🥣" },
  { category: "snacks", name: "Salted Potato Chips", unit: "52 g", price: 2000, mrp: 2000, stock: 100, emoji: "🥔" },
  { category: "snacks", name: "Chocolate Bar", unit: "40 g", price: 4000, mrp: 4000, stock: 120, emoji: "🍫" },
  { category: "snacks", name: "Roasted Peanuts", unit: "200 g", price: 6500, mrp: 8000, stock: 45, emoji: "🥜" },
  { category: "snacks", name: "Butter Cookies", unit: "150 g", price: 3000, mrp: 3500, stock: 80, emoji: "🍪" },
  { category: "beverages", name: "Cola", unit: "750 ml", price: 4000, mrp: 4000, stock: 90, emoji: "🥤" },
  { category: "beverages", name: "Orange Juice", unit: "1 L", price: 11000, mrp: 13000, stock: 35, emoji: "🧃" },
  { category: "beverages", name: "Tender Coconut", unit: "1 pc", price: 5500, mrp: 6000, stock: 30, emoji: "🥥" },
  { category: "beverages", name: "Packaged Water", unit: "1 L", price: 2000, mrp: 2000, stock: 200, emoji: "💧" },
  { category: "staples", name: "Whole Wheat Atta", unit: "5 kg", price: 24900, mrp: 29000, stock: 40, emoji: "🌾" },
  { category: "staples", name: "Basmati Rice", unit: "1 kg", price: 14900, mrp: 18000, stock: 50, emoji: "🍚" },
  { category: "staples", name: "Toor Dal", unit: "1 kg", price: 16500, mrp: 19000, stock: 45, emoji: "🫘" },
  { category: "staples", name: "Sunflower Oil", unit: "1 L", price: 15500, mrp: 17500, stock: 60, emoji: "🫗" },
  { category: "household", name: "Dishwash Liquid", unit: "500 ml", price: 9900, mrp: 11500, stock: 40, emoji: "🧽" },
  { category: "household", name: "Detergent Powder", unit: "1 kg", price: 12500, mrp: 14000, stock: 35, emoji: "🧺" },
  { category: "household", name: "Floor Cleaner", unit: "1 L", price: 18900, mrp: 21000, stock: 25, emoji: "🧴" },
  { category: "personal-care", name: "Bath Soap", unit: "3 x 100 g", price: 13500, mrp: 15000, stock: 50, emoji: "🧼" },
  { category: "personal-care", name: "Toothpaste", unit: "150 g", price: 9500, mrp: 10500, stock: 60, emoji: "🪥" },
  { category: "personal-care", name: "Shampoo", unit: "340 ml", price: 29900, mrp: 34000, stock: 30, emoji: "🧴" },
];

// Placeholder delivery zones. Replace with the real launch area's pincodes.
export const seedZones = [
  { pincode: "560001", area: "Zone 1 (placeholder)", eta: 10 },
  { pincode: "560002", area: "Zone 2 (placeholder)", eta: 15 },
  { pincode: "560003", area: "Zone 3 (placeholder)", eta: 20 },
];
