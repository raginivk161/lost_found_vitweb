// Matching algorithm configuration
// All weights and thresholds in one place

module.exports = {
  // Score weights (must sum to 1.0)
  weights: {
    image: 0.45,
    text: 0.25,
    category: 0.15,
    location: 0.10,
    time: 0.05,
  },

  // When an item has no image, redistribute image weight to text
  noImageWeights: {
    image: 0,
    text: 0.70,
    category: 0.15,
    location: 0.10,
    time: 0.05,
  },

  // Match thresholds
  thresholds: {
    strong: 0.70,   // >= 0.70: "Strong match"
    possible: 0.50, // 0.50-0.69: "Possible match"
    minimum: 0.50,  // < 0.50: not shown
  },

  // Category similarity map
  categoryRelations: {
    'Electronics': ['Accessories', 'Chargers & Cables'],
    'Accessories': ['Electronics', 'Clothing'],
    'Clothing': ['Accessories'],
    'Books & Notes': ['Stationery'],
    'Stationery': ['Books & Notes'],
    'ID Cards & Documents': ['Keys & Access Cards'],
    'Keys & Access Cards': ['ID Cards & Documents'],
    'Bags & Wallets': ['Accessories'],
    'Water Bottles & Containers': [],
    'Sports Equipment': [],
    'Headphones & Earbuds': ['Electronics'],
    'Chargers & Cables': ['Electronics'],
    'Umbrellas': [],
    'Other': [],
  },

  // Location proximity groups
  locationGroups: {
    'Main Building': ['AB-1', 'AB-2', 'Main Gate'],
    'AB-1': ['Main Building', 'AB-2', 'TT Block'],
    'AB-2': ['Main Building', 'AB-1', 'TT Block'],
    'TT Block': ['AB-1', 'AB-2', 'SJT'],
    'SJT': ['TT Block', 'Technology Tower', 'SMV'],
    'SMV': ['SJT', 'Technology Tower'],
    'Technology Tower': ['SJT', 'SMV'],
    'GDN Block': ['Mens Hostel', 'Anna Auditorium'],
    'Anna Auditorium': ['GDN Block', 'Main Gate'],
    'Main Gate': ['Main Building', 'Anna Auditorium'],
    'Library': ['Main Building', 'AB-1'],
    'Food Court': ['Mens Hostel', 'Womens Hostel'],
    'Mens Hostel': ['Food Court', 'GDN Block'],
    'Womens Hostel': ['Food Court'],
    'Sports Complex': ['Mens Hostel'],
    'CDMM': ['SJT', 'Technology Tower'],
    'VIT Mall': ['Main Gate'],
  },

  // Categories list
  categories: [
    'Electronics',
    'Accessories',
    'Clothing',
    'Books & Notes',
    'Stationery',
    'ID Cards & Documents',
    'Keys & Access Cards',
    'Bags & Wallets',
    'Water Bottles & Containers',
    'Sports Equipment',
    'Headphones & Earbuds',
    'Chargers & Cables',
    'Umbrellas',
    'Other',
  ],

  // Locations list
  locations: [
    'Main Building',
    'AB-1',
    'AB-2',
    'TT Block',
    'SJT',
    'SMV',
    'Technology Tower',
    'GDN Block',
    'Anna Auditorium',
    'Main Gate',
    'Library',
    'Food Court',
    'Mens Hostel',
    'Womens Hostel',
    'Sports Complex',
    'CDMM',
    'VIT Mall',
  ],

  // Time decay: score = max(0, 1 - dayGap * decayRate)
  timeDecayRate: 0.05, // loses 0.05 per day gap

  // CLIP model name
  clipModel: 'Xenova/clip-vit-base-patch32',

  // Verification fuzzy match threshold
  verificationThreshold: 0.4,
  maxVerificationAttempts: 3,

  // Karma points for returning an item
  karmaPointsPerReturn: 10,
};
