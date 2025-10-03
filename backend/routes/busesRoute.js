import { Router } from 'express';
import Bus from '../model/busModel.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

// GET all buses (public - lists all active buses; use /get-all-buses POST for search)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const query = {
      isActive: { $ne: false },
      status: { $ne: 'Cancelled' }
    };

    // Filter out old completed buses
    const buses = await Bus.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          number: { $first: "$number" },
          capacity: { $first: "$capacity" },
          from: { $first: "$from" },
          to: { $first: "$to" },
          journeydate: { $first: "$journeydate" },
          arrivaldate: { $first: "$arrivaldate" },
          departure: { $first: "$departure" },
          arrival: { $first: "$arrival" },
          price: { $first: "$price" },
          drivername: { $first: "$drivername" },
          pickup: { $first: "$pickup" },
          dropoff: { $first: "$dropoff" },
          amenities: { $first: "$amenities" },
          status: { $first: "$status" },
          seatsBooked: { $first: "$seatsBooked" },
          isActive: { $first: "$isActive" },
          busGroupId: { $first: "$busGroupId" },
          isSegment: { $first: "$isSegment" },
          parentBus: { $first: "$parentBus" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" }
        }
      },
      {
        $sort: { 
          journeydate: 1, 
          departure: 1,
          _id: 1
        }
      }
    ]);

    // Filter out buses to delete: if now > (journeydate + arrival time + 1 hour)
    const busesToKeep = buses.filter(bus => {
      const journeyDate = new Date(bus.journeydate);
      const arrivalTimeMatch = bus.arrival ? bus.arrival.match(/(\d{1,2}):(\d{2})/) : null;
      if (!arrivalTimeMatch) return true;  // If no arrival, keep it
      const arrivalHours = parseInt(arrivalTimeMatch[1]);
      const arrivalMins = parseInt(arrivalTimeMatch[2]);
      const fullArrival = new Date(journeyDate);
      fullArrival.setHours(arrivalHours, arrivalMins, 0, 0);
      const deleteAfter = new Date(fullArrival.getTime() + 60 * 60 * 1000);  // +1 hour
      return now < deleteAfter;
    });

    // FIXED: Sync seats across bus groups - Get shared seat inventory for each bus group
    const busGroupIds = [...new Set(busesToKeep.map(bus => bus.busGroupId).filter(Boolean))];
    const groupSeatsMap = {};
    
    // For each group, find the authoritative source of booked seats (main bus or segment with most bookings)
    for (const groupId of busGroupIds) {
      const groupBuses = await Bus.find({ busGroupId: groupId });
      let maxBookedSeats = [];
      
      // Find the bus in the group with the most booked seats (authoritative source)
      for (const bus of groupBuses) {
        if (bus.seatsBooked && bus.seatsBooked.length > maxBookedSeats.length) {
          maxBookedSeats = bus.seatsBooked;
        }
      }
      
      groupSeatsMap[groupId] = maxBookedSeats;
    }

    // Now calculate available seats for each bus using shared inventory
    const busesWithAvailableSeats = busesToKeep.map(bus => {
      // Use shared seat inventory for this bus group
      const sharedSeatsBooked = groupSeatsMap[bus.busGroupId] || bus.seatsBooked || [];
      const seatsBookedCount = sharedSeatsBooked.length;
      const availableSeats = bus.capacity - seatsBookedCount;
      const isFullyBooked = seatsBookedCount >= bus.capacity;

      // Calculate full departure datetime
      const journeyDate = new Date(bus.journeydate);
      const depTimeMatch = bus.departure ? bus.departure.match(/(\d{1,2}):(\d{2})/) : null;
      let bookingDisabled = false;
      if (depTimeMatch) {
        const depHours = parseInt(depTimeMatch[1]);
        const depMins = parseInt(depTimeMatch[2]);
        const fullDeparture = new Date(journeyDate);
        fullDeparture.setHours(depHours, depMins, 0, 0);
        const bookingClose = new Date(fullDeparture.getTime() - 30 * 60 * 1000);  // -30 min
        bookingDisabled = now >= bookingClose;
      }

      return {
        ...bus,
        seatsBooked: sharedSeatsBooked, // Use shared seat inventory
        availableSeats, 
        isFullyBooked,
        bookingDisabled
      };
    });

    // Additional duplicate check
    const uniqueBusesMap = new Map();
    busesWithAvailableSeats.forEach(bus => {
      if (!uniqueBusesMap.has(bus._id.toString())) {
        uniqueBusesMap.set(bus._id.toString(), bus);
      }
    });
    
    const finalBuses = Array.from(uniqueBusesMap.values());

    console.log('--- BACKEND DEBUG: All Buses Response ---');
    console.log('Unique buses count:', finalBuses.length);

    return res.status(200).send({
      success: true,
      data: finalBuses,
      message: finalBuses.length > 0
        ? 'All active buses fetched successfully'
        : 'No active buses found',
      totalCount: finalBuses.length
    });

  } catch (error) {
    console.error('Error fetching all buses:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error while fetching buses'
    });
  }
});

// ADD a new bus (admin only - requires auth)
router.post('/add-bus', authMiddleware, async (req, res) => {
  try {
    const newBus = new Bus(req.body);
    await newBus.save();
    
    // If intermediate stops are provided, create additional buses for each segment
    if (req.body.intermediateStops && req.body.intermediateStops.length > 0) {
      const mainBusId = newBus._id;
      const busGroupId = mainBusId.toString();
      
      // Update the main bus with the group ID
      await Bus.findByIdAndUpdate(mainBusId, { busGroupId });
      
      // Create buses for all segments: A-B, A-C, A-D
      const segmentBuses = [];
      
      // Add the final destination as the last stop
      const allStops = [
        ...req.body.intermediateStops,
        {  
          city: req.body.to, 
          dropoff: req.body.dropoff, 
          arrivalTime: req.body.arrival, 
          additionalPrice: req.body.price // Use base price for final destination
        }
      ];
      
      // Create a bus for each segment
      for (let i = 0; i < allStops.length; i++) {
        const stop = allStops[i];
        
        const segmentBus = new Bus({
          ...req.body,
          to: stop.city,
          dropoff: stop.dropoff,
          arrival: stop.arrivalTime,
          price: stop.additionalPrice, // Use only the additionalPrice for segments
          parentBus: mainBusId,
          busGroupId: busGroupId,
          isSegment: true,
          // IMPORTANT: All segments share the same seat inventory
          seatsBooked: [], // Start empty, will be synced with main bus
          _id: undefined // Let MongoDB generate new ID
        });
        
        segmentBuses.push(segmentBus.save());
      }
      
      await Promise.all(segmentBuses);
    }
    
    res.status(201).send({ success: true, message: 'Bus added successfully' });
  } catch (error) {
    console.error('Error adding bus:', error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// FETCH all buses matching search criteria (PUBLIC - no auth required)
router.post('/get-all-buses', async (req, res) => {
  try {
    const { from, to, departureDate } = req.body;

    console.log('--- BACKEND DEBUG: Search Request ---');
    console.log('From:', from);
    console.log('To:', to);
    console.log('Departure Date:', departureDate);

    const query = {};
    const now = new Date();  // Current time

    if (from?.trim()) {
      query.from = { $regex: new RegExp(from.trim(), 'i') };
    }

    if (to?.trim()) {
      query.to = { $regex: new RegExp(to.trim(), 'i') };
    }

    if (departureDate?.trim()) {
      try {
        const searchDate = new Date(departureDate);
        if (isNaN(searchDate.getTime())) {
          return res.status(400).send({
            success: false,
            message: 'Invalid date format'
          });
        }

        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(searchDate);
        endOfDay.setHours(23, 59, 59, 999);

        query.journeydate = {
          $gte: startOfDay,
          $lte: endOfDay
        };
      } catch (error) {
        console.error('Error processing departureDate:', error);
        return res.status(400).send({
          success: false,
          message: 'Invalid date format'
        });
      }
    }

    // Only show active buses for public users
    query.isActive = { $ne: false };
    query.status = { $ne: 'Cancelled' };

    console.log('--- BACKEND DEBUG: MongoDB Query ---');
    console.log(JSON.stringify(query, null, 2));

    // Use aggregation pipeline to ensure no duplicates and better control
    const buses = await Bus.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          number: { $first: "$number" },
          capacity: { $first: "$capacity" },
          from: { $first: "$from" },
          to: { $first: "$to" },
          journeydate: { $first: "$journeydate" },
          arrivaldate: { $first: "$arrivaldate" },
          departure: { $first: "$departure" },
          arrival: { $first: "$arrival" },
          price: { $first: "$price" },
          drivername: { $first: "$drivername" },
          pickup: { $first: "$pickup" },
          dropoff: { $first: "$dropoff" },
          amenities: { $first: "$amenities" },
          status: { $first: "$status" },
          seatsBooked: { $first: "$seatsBooked" },
          isActive: { $first: "$isActive" },
          busGroupId: { $first: "$busGroupId" },
          isSegment: { $first: "$isSegment" },
          parentBus: { $first: "$parentBus" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" }
        }
      },
      {
        $sort: { 
          journeydate: 1, 
          departure: 1,
          _id: 1
        }
      }
    ]);

    console.log('--- BACKEND DEBUG: Found Buses Count ---');
    console.log('Total buses found:', buses.length);

    // Filter out buses to delete: if now > (journeydate + arrival time + 1 hour)
    const busesToKeep = buses.filter(bus => {
      const journeyDate = new Date(bus.journeydate);
      const arrivalTimeMatch = bus.arrival ? bus.arrival.match(/(\d{1,2}):(\d{2})/) : null;
      if (!arrivalTimeMatch) return true;  // If no arrival, keep it
      const arrivalHours = parseInt(arrivalTimeMatch[1]);
      const arrivalMins = parseInt(arrivalTimeMatch[2]);
      const fullArrival = new Date(journeyDate);
      fullArrival.setHours(arrivalHours, arrivalMins, 0, 0);
      const deleteAfter = new Date(fullArrival.getTime() + 60 * 60 * 1000);  // +1 hour
      return now < deleteAfter;
    });

    // FIXED: Sync seats across bus groups - Get shared seat inventory for each bus group
    const busGroupIds = [...new Set(busesToKeep.map(bus => bus.busGroupId).filter(Boolean))];
    const groupSeatsMap = {};
    
    // For each group, find the authoritative source of booked seats (main bus or segment with most bookings)
    for (const groupId of busGroupIds) {
      const groupBuses = await Bus.find({ busGroupId: groupId });
      let maxBookedSeats = [];
      
      // Find the bus in the group with the most booked seats (authoritative source)
      for (const bus of groupBuses) {
        if (bus.seatsBooked && bus.seatsBooked.length > maxBookedSeats.length) {
          maxBookedSeats = bus.seatsBooked;
        }
      }
      
      groupSeatsMap[groupId] = maxBookedSeats;
    }

    // Now calculate available seats for each bus using shared inventory
    const busesWithAvailableSeats = busesToKeep.map(bus => {
      // Use shared seat inventory for this bus group
      const sharedSeatsBooked = groupSeatsMap[bus.busGroupId] || bus.seatsBooked || [];
      const seatsBookedCount = sharedSeatsBooked.length;
      const availableSeats = bus.capacity - seatsBookedCount;
      const isFullyBooked = seatsBookedCount >= bus.capacity;

      // Calculate full departure datetime
      const journeyDate = new Date(bus.journeydate);
      const depTimeMatch = bus.departure ? bus.departure.match(/(\d{1,2}):(\d{2})/) : null;
      let bookingDisabled = false;
      if (depTimeMatch) {
        const depHours = parseInt(depTimeMatch[1]);
        const depMins = parseInt(depTimeMatch[2]);
        const fullDeparture = new Date(journeyDate);
        fullDeparture.setHours(depHours, depMins, 0, 0);
        const bookingClose = new Date(fullDeparture.getTime() - 30 * 60 * 1000);  // -30 min
        bookingDisabled = now >= bookingClose;
      }

      return {
        ...bus,
        seatsBooked: sharedSeatsBooked, // Use shared seat inventory
        availableSeats, 
        isFullyBooked,
        bookingDisabled
      };
    });

    // Additional duplicate check
    const uniqueBusesMap = new Map();
    busesWithAvailableSeats.forEach(bus => {
      if (!uniqueBusesMap.has(bus._id.toString())) {
        uniqueBusesMap.set(bus._id.toString(), bus);
      }
    });
    
    const finalBuses = Array.from(uniqueBusesMap.values());

    console.log('--- BACKEND DEBUG: Final Response ---');
    console.log('Unique buses count:', finalBuses.length);
    console.log('First 2 buses:', finalBuses.slice(0, 2).map(bus => ({
      id: bus._id,
      name: bus.name,
      number: bus.number,
      from: bus.from,
      to: bus.to,
      availableSeats: bus.availableSeats,
      bookingDisabled: bus.bookingDisabled
    })));

    return res.status(200).send({
      success: true,
      data: finalBuses,
      message: finalBuses.length > 0
        ? 'Buses fetched successfully'
        : 'No buses found matching your criteria',
      totalCount: finalBuses.length
    });

  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error while fetching buses'
    });
  }
});

// GET bus by ID (PUBLIC - no auth required for viewing bus details)
router.get('/get-bus/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).send({
        success: false,
        message: 'Bus not found'
      });
    }

    // Only show active buses for public users
    if (bus.isActive === false || bus.status === 'Cancelled') {
      return res.status(404).send({
        success: false,
        message: 'Bus not available'
      });
    }

    // FIXED: Get shared seat inventory for this bus group
    let sharedSeatsBooked = bus.seatsBooked || [];
    
    if (bus.busGroupId) {
      // Get all buses in the same group
      const groupBuses = await Bus.find({ busGroupId: bus.busGroupId });
      
      // Find the bus with the most booked seats (authoritative source)
      let maxBookedSeats = [];
      for (const groupBus of groupBuses) {
        if (groupBus.seatsBooked && groupBus.seatsBooked.length > maxBookedSeats.length) {
          maxBookedSeats = groupBus.seatsBooked;
        }
      }
      
      sharedSeatsBooked = maxBookedSeats;
    }

    const busWithAvailableSeats = {
      ...bus.toObject(),
      seatsBooked: sharedSeatsBooked, // Use shared inventory
      availableSeats: bus.capacity - sharedSeatsBooked.length,
      isFullyBooked: sharedSeatsBooked.length >= bus.capacity
    };

    res.status(200).send({
      success: true,
      data: busWithAvailableSeats,
      message: 'Bus fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching bus by ID:', error);
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

// FIXED: BOOK seats with proper shared inventory management
router.post('/book-seats', authMiddleware, async (req, res) => {
  try {
    const { busId, seats } = req.body;

    if (!busId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).send({ success: false, message: 'Invalid request: busId and seats array are required' });
    }

    // Find the requested bus
    const requestedBus = await Bus.findById(busId);
    if (!requestedBus) {
      return res.status(404).send({ success: false, message: 'Bus not found' });
    }

    // Find all buses in the same group (they share the same physical seats)
    const groupBuses = await Bus.find({ busGroupId: requestedBus.busGroupId });
    
    if (groupBuses.length === 0) {
      return res.status(404).send({ success: false, message: 'Bus group not found' });
    }

    // Find the bus with the most booked seats (authoritative source)
    let authoritativeBus = groupBuses[0];
    for (const bus of groupBuses) {
      if (bus.seatsBooked && bus.seatsBooked.length > authoritativeBus.seatsBooked.length) {
        authoritativeBus = bus;
      }
    }

    // Check if any seats are already booked using shared inventory
    const currentlyBookedSeats = authoritativeBus.seatsBooked || [];
    const alreadyBooked = seats.filter(seat => currentlyBookedSeats.includes(seat.toString()));
    
    if (alreadyBooked.length > 0) {
      return res.status(400).send({ 
        success: false, 
        message: `Seats ${alreadyBooked.join(', ')} are already booked` 
      });
    }

    // Check available capacity using the requested bus's capacity
    if (currentlyBookedSeats.length + seats.length > requestedBus.capacity) {
      return res.status(400).send({ 
        success: false, 
        message: 'Not enough seats available' 
      });
    }

    // Update seats for ALL buses in the group (shared physical inventory)
    const newBookedSeats = [...currentlyBookedSeats, ...seats.map(seat => seat.toString())];
    const isFullyBooked = newBookedSeats.length >= requestedBus.capacity;

    // Update all buses in the group with the same booked seats
    const updatePromises = groupBuses.map(bus => 
      Bus.findByIdAndUpdate(bus._id, {
        seatsBooked: newBookedSeats,
        isFullyBooked: isFullyBooked
      })
    );

    await Promise.all(updatePromises);

    res.status(200).send({ 
      success: true, 
      message: 'Seats booked successfully across all segments',
      bookedSeats: seats,
      totalBookedSeats: newBookedSeats.length,
      affectedBuses: groupBuses.length
    });
  } catch (error) {
    console.error('Error booking seats:', error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// UPDATE bus status (admin only)
router.put('/update-bus-status/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Yet To Start', 'Running', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).send({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!bus) {
      return res.status(404).send({
        success: false,
        message: 'Bus not found'
      });
    }

    // FIXED: Update status for all buses in the same group
    if (bus.busGroupId) {
      await Bus.updateMany(
        { busGroupId: bus.busGroupId },
        { status }
      );
    }

    res.status(200).send({
      success: true,
      data: bus,
      message: 'Bus status updated successfully for all segments'
    });
  } catch (error) {
    console.error('Error updating bus status:', error);
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

// EDIT bus details (admin only)
router.put('/edit-bus/:id', authMiddleware, async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bus) {
      return res.status(404).send({
        success: false,
        message: 'Bus not found'
      });
    }

    res.status(200).send({
      success: true,
      data: bus,
      message: 'Bus details updated successfully'
    });
  } catch (error) {
    console.error('Error editing bus details:', error);
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

// DELETE bus (admin only)
router.delete('/delete-bus/:id', authMiddleware, async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    
    if (!bus) {
      return res.status(404).send({
        success: false,
        message: 'Bus not found'
      });
    }
    
    // If this is a main bus, delete all its intermediate buses too
    if (!bus.parentBus) {
      await Bus.deleteMany({ busGroupId: bus.busGroupId });
    } else {
      // If this is an intermediate bus, just delete it
      await Bus.findByIdAndDelete(req.params.id);
    }

    res.status(200).send({
      success: true,
      message: 'Bus deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bus:', error);
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

// Admin endpoint to delete old completed buses (call this via cron job)
router.delete('/cleanup-old-buses', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    // Find buses where estimated delete time < now
    const busesToDelete = await Bus.find({
      status: 'Completed',
    });

    let deletedCount = 0;
    for (const bus of busesToDelete) {
      // Recalc delete time as in filter above
      const journeyDate = new Date(bus.journeydate);
      const arrivalTimeMatch = bus.arrival ? bus.arrival.match(/(\d{1,2}):(\d{2})/) : null;
      if (arrivalTimeMatch) {
        const arrivalHours = parseInt(arrivalTimeMatch[1]);
        const arrivalMins = parseInt(arrivalTimeMatch[2]);
        const fullArrival = new Date(journeyDate);
        fullArrival.setHours(arrivalHours, arrivalMins, 0, 0);
        const deleteAfter = new Date(fullArrival.getTime() + 60 * 60 * 1000);
        if (now > deleteAfter) {
          // If this is a main bus, delete all its intermediate buses too
          if (!bus.parentBus) {
            await Bus.deleteMany({ busGroupId: bus.busGroupId });
            deletedCount += (await Bus.countDocuments({ busGroupId: bus.busGroupId })) + 1;
          } else {
            await Bus.findByIdAndDelete(bus._id);
            deletedCount++;
          }
        }
      }
    }

    res.status(200).send({
      success: true,
      message: `Cleaned up ${deletedCount} old buses`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up buses:', error);
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

export default router;
