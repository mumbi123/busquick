import { Router } from 'express';
import Price from '../model/PriceModel.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

// GET all prices (public - lists all prices; use /get-all-prices POST for filtered/paginated)
router.get('/', async (req, res) => {
  try {
    const prices = await Price.find({}).sort({ name: 1, from: 1 }).lean();
    
    res.json({ 
      success: true, 
      data: prices,
      count: prices.length,
      message: prices.length > 0 ? 'All prices fetched successfully' : 'No prices found'
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch prices. Please try again.' 
    });
  }
});

// Validation helper function
const validatePriceData = (name, from, to, price) => {
  const errors = [];
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Bus name is required');
  } else if (name.trim().length < 2) {
    errors.push('Bus name must be at least 2 characters');
  } else if (name.trim().length > 50) {
    errors.push('Bus name must not exceed 50 characters');
  }
  
  if (!from || typeof from !== 'string' || from.trim().length === 0) {
    errors.push('Departure location is required');
  } else if (from.trim().length < 2) {
    errors.push('Departure location must be at least 2 characters');
  } else if (from.trim().length > 30) {
    errors.push('Departure location must not exceed 30 characters');
  }
  
  if (!to || typeof to !== 'string' || to.trim().length === 0) {
    errors.push('Destination location is required');
  } else if (to.trim().length < 2) {
    errors.push('Destination location must be at least 2 characters');
  } else if (to.trim().length > 30) {
    errors.push('Destination location must not exceed 30 characters');
  }
  
  if (price == null || price === undefined) {
    errors.push('Price is required');
  } else {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      errors.push('Price must be a valid number');
    } else if (numPrice <= 0) {
      errors.push('Price must be greater than 0');
    } else if (numPrice > 9999.99) {
      errors.push('Price must not exceed K9999.99');
    }
  }
  
  return errors;
};

// Normalize location names for consistency
const normalizeLocation = (location) => {
  return location.trim().toLowerCase().replace(/\s+/g, ' ');
};

// @route   POST /api/prices/add-price
// @desc    Add a new price
// @access  Private (Admin only)
router.post('/add-price', authMiddleware, async (req, res) => {
  try {
    const { name, from, to, price } = req.body;
    
    // Validate input data
    const validationErrors = validatePriceData(name, from, to, price);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: validationErrors[0] // Return first validation error
      });
    }

    // Normalize and trim data
    const normalizedData = {
      name: name.trim(),
      from: from.trim(),
      to: to.trim(),
      price: parseFloat(price)
    };

    // Check for duplicate route (case-insensitive)
    const exists = await Price.findOne({ 
      name: new RegExp(`^${normalizedData.name}$`, 'i'),
      from: new RegExp(`^${normalizedData.from}$`, 'i'),
      to: new RegExp(`^${normalizedData.to}$`, 'i')
    });
    
    if (exists) {
      return res.status(409).json({ 
        success: false, 
        message: 'A price for this route already exists' 
      });
    }

    // Create new price entry
    const newPrice = new Price(normalizedData);
    const savedPrice = await newPrice.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Price added successfully', 
      data: savedPrice 
    });
    
  } catch (error) {
    console.error('Error adding price:', error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationError = Object.values(error.errors)[0];
      return res.status(400).json({ 
        success: false, 
        message: validationError.message 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'A price for this route already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add price. Please try again.' 
    });
  }
});

// @route   POST /api/prices/get-all-prices
// @desc    Get all prices with optional filtering and pagination
// @access  Private (Admin only)
router.post('/get-all-prices', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.body;

    // Build search query
    let query = {};
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { name: searchRegex },
          { from: searchRegex },
          { to: searchRegex }
        ]
      };
    }

    // Build sort object
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortObj = {};
    sortObj[sortBy] = sortDirection;

    // If sorting by name, add secondary sort by from and to
    if (sortBy === 'name') {
      sortObj.from = 1;
      sortObj.to = 1;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const prices = await Price.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Price.countDocuments(query);

    res.json({ 
      success: true, 
      data: prices,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch prices. Please try again.' 
    });
  }
});

// @route   GET /api/prices/:id
// @desc    Get a single price by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid price ID format' 
      });
    }

    const price = await Price.findById(id).lean();
    
    if (!price) {
      return res.status(404).json({ 
        success: false, 
        message: 'Price not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: price 
    });
    
  } catch (error) {
    console.error('Error fetching price:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch price. Please try again.' 
    });
  }
});

// @route   POST /api/prices/update-price/:id
// @desc    Update a price
// @access  Private (Admin only)
router.post('/update-price/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, from, to, price } = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid price ID format' 
      });
    }

    // Validate input data
    const validationErrors = validatePriceData(name, from, to, price);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: validationErrors[0]
      });
    }

    // Normalize and trim data
    const normalizedData = {
      name: name.trim(),
      from: from.trim(),
      to: to.trim(),
      price: parseFloat(price)
    };

    // Check if price record exists
    const existingPrice = await Price.findById(id);
    if (!existingPrice) {
      return res.status(404).json({ 
        success: false, 
        message: 'Price not found' 
      });
    }

    // Check for duplicate route (excluding current record, case-insensitive)
    const duplicateExists = await Price.findOne({ 
      name: new RegExp(`^${normalizedData.name}$`, 'i'),
      from: new RegExp(`^${normalizedData.from}$`, 'i'),
      to: new RegExp(`^${normalizedData.to}$`, 'i'),
      _id: { $ne: id } 
    });
    
    if (duplicateExists) {
      return res.status(409).json({ 
        success: false, 
        message: 'A price for this route already exists' 
      });
    }

    // Update the price
    const updatedPrice = await Price.findByIdAndUpdate(
      id,
      normalizedData,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    ).lean();
    
    res.json({ 
      success: true, 
      message: 'Price updated successfully', 
      data: updatedPrice 
    });
    
  } catch (error) {
    console.error('Error updating price:', error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationError = Object.values(error.errors)[0];
      return res.status(400).json({ 
        success: false, 
        message: validationError.message 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'A price for this route already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update price. Please try again.' 
    });
  }
});

// @route   DELETE /api/prices/delete-price/:id
// @desc    Delete a price
// @access  Private (Admin only)
router.delete('/delete-price/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid price ID format' 
      });
    }

    const deletedPrice = await Price.findByIdAndDelete(id).lean();
    
    if (!deletedPrice) {
      return res.status(404).json({ 
        success: false, 
        message: 'Price not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Price deleted successfully',
      data: deletedPrice 
    });
    
  } catch (error) {
    console.error('Error deleting price:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete price. Please try again.' 
    });
  }
});

// @route   GET /api/prices/search/routes
// @desc    Search routes for public booking
// @access  Public
router.get('/search/routes', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both departure and destination locations are required' 
      });
    }

    const prices = await Price.find({
      from: new RegExp(`^${from.trim()}$`, 'i'),
      to: new RegExp(`^${to.trim()}$`, 'i')
    })
    .sort({ price: 1, name: 1 })
    .lean();

    res.json({ 
      success: true, 
      data: prices,
      count: prices.length 
    });
    
  } catch (error) {
    console.error('Error searching routes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search routes. Please try again.' 
    });
  }
});

// @route   GET /api/prices/locations/all
// @desc    Get all unique locations (from and to) for dropdowns
// @access  Public
router.get('/locations/all', async (req, res) => {
  try {
    const locations = await Price.aggregate([
      {
        $group: {
          _id: null,
          fromLocations: { $addToSet: '$from' },
          toLocations: { $addToSet: '$to' }
        }
      },
      {
        $project: {
          _id: 0,
          locations: { $setUnion: ['$fromLocations', '$toLocations'] }
        }
      }
    ]);

    const allLocations = locations.length > 0 ? locations[0].locations.sort() : [];

    res.json({ 
      success: true, 
      data: allLocations 
    });
    
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch locations. Please try again.' 
    });
  }
});

export default router;
