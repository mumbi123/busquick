import { Router } from 'express';
import Bus from '../model/busModel.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

// Utility function to get current time in CAT/SAST timezone (Africa/Lusaka)
const getCurrentTimeInLusaka = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lusaka' }));
};

// Utility function to parse date string and treat it as Lusaka timezone
const parseAsLusakaTime = (dateString) => {
  // Parse the date string but treat it as if it's already in Lusaka timezone
  const date = new Date(dateString);
  // Get the date components
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Create a new date using Lusaka timezone interpretation
  const lusakaDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`;
  return new Date(lusakaDateStr);
};

// GET all buses (public - lists all active buses; use /get-all-buses POST for search)
router.get('/', async (req, res) => {
  try {
    const now = getCurrentTimeInLusaka();
    const query = {
      isActive: { $ne: false },
      status: { $ne: 'Cancelled' }
    };

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

    const busesToKeep = buses.filter(bus => {
      const journeyDate = new Date(bus.journeydate);
      const arrivalTimeMatch = bus.arrival ? bus.arrival.match(/(\d{1,2}):(\d{2})/) : null;
      if (!arrivalTimeMatch) return true;
      const arrivalHours = parseInt(arrivalTimeMatch[1]);
      const arrivalMins = parseInt(arrivalTimeMatch[2]);
      const fullArrival = new Date(journeyDate);
      fullArrival.setHours(arrivalHours, arrivalMins, 0, 0);
      const deleteAfter = new Date(fullArrival.getTime() + 60 * 60 * 1000);
      return now < deleteAfter;
    });

    const busGroupIds = [...new Set(busesToKeep.map(bus => bus.busGroupId).filter(Boolean))];
    const groupSeatsMap = {};
    
    for (const groupId of busGroupIds) {
      const groupBuses = await Bus.find({ busGroupId: groupId });
      let maxBookedSeats = [];
      
      for (const bus of groupBuses) {
        if (bus.seatsBooked && bus.seatsBooked.length > maxBookedSeats.length) {
          maxBookedSeats = bus.seatsBooked;
        }
      }
      
      groupSeatsMap[groupId] = maxBookedSeats;
    }

    const busesWithAvailableSeats = busesToKeep.map(bus => {
      const sharedSeatsBooked = groupSeatsMap[bus.busGroupId] || bus.seatsBooked || [];
      const seatsBookedCount = sharedSeatsBooked.length;
      const availableSeats = bus.capacity - seatsBookedCount;
      const isFullyBooked = seatsBookedCount >= bus.capacity;

      const journeyDate = new Date(bus.journeydate);
      const depTimeMatch = bus.departure ? bus.departure.match(/(\d{1,2}):(\d{2})/) : null;
      let bookingDisabled = false;
      if (depTimeMatch) {
        const depHours = parseInt(depTimeMatch[1]);
        const depMins = parseInt(depTimeMatch[2]);
        const fullDeparture = new Date(journeyDate);
        fullDeparture.setHours(depHours, depMins, 0, 0);
        const bookingClose = new Date(fullDeparture.getTime() - 30 * 60 * 1000);
        bookingDisabled = now >= bookingClose;
      }

      return {
        ...bus,
        seatsBooked: sharedSeatsBooked,
        availableSeats, 
        isFullyBooked,
        bookingDisabled
      };
    });

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
    console.log('--- ADDING BUS (Zambian Time Zone) ---');
    console.log('Received journey date:', req.body.journeydate);
    console.log('Received departure time:', req.body.departure);
    console.log('Received arrival time:', req.body.arrival);
    
    const newBus = new Bus(req.body);
    await newBus.save();
    
    console.log('--- SAVED BUS ---');
    console.log('Saved journey date:', newBus.journeydate);
    console.log('Saved departure time:', newBus.departure);
    console.log('Saved arrival time:', newBus.arrival);
    
    // If intermediate stops are provided, create additional buses for each segment
    if (req.body.intermediateStops && req.body.intermediateStops.length > 0) {
      const mainBusId = newBus._id;
      const busGroupId = mainBusId.toString();
      
      await Bus.findByIdAndUpdate(mainBusId, { busGroupId });
      
      const segmentBuses = [];
      
      const allStops = [
        ...req.body.intermediateStops,
        {  
          city: req.body.to, 
          dropoff: req.body.dropoff, 
          arrivalTime: req.body.arrival, 
          additionalPrice: req.body.price
        }
      ];
      
      for (let i = 0; i < allStops.length; i++) {
        const stop = allStops[i];
        
        const segmentBus = new Bus({
          ...req.body,
          to: stop.city,
          dropoff: stop.dropoff,
          arrival: stop.arrivalTime,
          price: stop.additionalPrice,
          parentBus: mainBusId,
          busGroupId: busGroupId,
          isSegment: true,
          seatsBooked: [],
          _id: undefined
        });
        
        segmentBuses.push(segmentBus.save());
      }
      
      await Promise.all(segmentBuses);
    }
    
    res.status(201).send({ 
      success: true, 
      message: 'Bus added successfully (times stored as Zambian/CAT timezone)'
    });
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
    const now = getCurrentTimeInLusaka();

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

    query.isActive = { $ne: false };
    query.status = { $ne: 'Cancelled' };

    console.log('--- BACKEND DEBUG: MongoDB Query ---');
    console.log(JSON.stringify(query, null, 2));

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

    const busesToKeep = buses.filter(bus => {
      const journeyDate = new Date(bus.journeydate);
      const arrivalTimeMatch = bus.arrival ? bus.arrival.match(/(\d{1,2}):(\d{2})/) : null;
      if (!arrivalTimeMatch) return true;
      const arrivalHours = parseInt(arrivalTimeMatch[1]);
      const arrivalMins = parseInt(arrivalTimeMatch[2]);
      const fullArrival = new Date(journeyDate);
      fullArrival.setHours(arrivalHours, arrivalMins, 0, 0);
      const deleteAfter = new Date(fullArrival.getTime() + 60 * 60 * 1000);
      return now < deleteAfter;
    });

    const busGroupIds = [...new Set(busesToKeep.map(bus => bus.busGroupId).filter(Boolean))];
    const groupSeatsMap = {};
    
    for (const groupId of busGroupIds) {
      const groupBuses = await Bus.find({ busGroupId: groupId });
      let maxBookedSeats = [];
      
      for (const bus of groupBuses) {
        if (bus.seatsBooked && bus.seatsBooked.length > maxBookedSeats.length) {
          maxBookedSeats = bus.seatsBooked;
        }
      }
      
      groupSeatsMap[groupId] = maxBookedSeats;
    }

    const busesWithAvailableSeats = busesToKeep.map(bus => {
      const sharedSeatsBooked = groupSeatsMap[bus.busGroupId] || bus.seatsBooked || [];
      const seatsBookedCount = sharedSeatsBooked.length;
      const availableSeats = bus.capacity - seatsBookedCount;
      const isFullyBooked = seatsBookedCount >= bus.capacity;

      const journeyDate = new Date(bus.journeydate);
      const depTimeMatch = bus.departure ? bus.departure.match(/(\d{1,2}):(\d{2})/) : null;
      let bookingDisabled = false;
      if (depTimeMatch) {
        const depHours = parseInt(depTimeMatch[1]);
        const depMins = parseInt(depTimeMatch[2]);
        const fullDeparture = new Date(journeyDate);
        fullDeparture.setHours(depHours, depMins, 0, 0);
        const bookingClose = new Date(fullDeparture.getTime() - 30 * 60 * 1000);
        bookingDisabled = now >= bookingClose;
      }

      return {
        ...bus,
        seatsBooked: sharedSeatsBooked,
        availableSeats, 
        isFullyBooked,
        bookingDisabled
      };
    });

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

    if (bus.isActive === false || bus.status === 'Cancelled') {
      return res.status(404).send({
        success: false,
        message: 'Bus not available'
      });
    }

    let sharedSeatsBooked = bus.seatsBooked || [];
    
    if (bus.busGroupId) {
      const groupBuses = await Bus.find({ busGroupId: bus.busGroupId });
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
      seatsBooked: sharedSeatsBooked,
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

// BOOK seats with proper shared inventory management
router.post('/book-seats', authMiddleware, async (req, res) => {
  try {
    const { busId, seats } = req.body;

    if (!busId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).send({ success: false, message: 'Invalid request: busId and seats array are required' });
    }

    const requestedBus = await Bus.findById(busId);
    if (!requestedBus) {
      return res.status(404).send({ success: false, message: 'Bus not found' });
    }

    const groupBuses = await Bus.find({ busGroupId: requestedBus.busGroupId });
    
    if (groupBuses.length === 0) {
      return res.status(404).send({ success: false, message: 'Bus group not found' });
    }

    let authoritativeBus = groupBuses[0];
    for (const bus of groupBuses) {
      if (bus.seatsBooked && bus.seatsBooked.length > authoritativeBus.seatsBooked.length) {
        authoritativeBus = bus;
      }
    }

    const currentlyBookedSeats = authoritativeBus.seatsBooked || [];
    const alreadyBooked = seats.filter(seat => currentlyBookedSeats.includes(seat.toString()));
    
    if (alreadyBooked.length > 0) {
      return res.status(400).send({ 
        success: false, 
        message: `Seats ${alreadyBooked.join(', ')} are already booked` 
      });
    }

    if (currentlyBookedSeats.length + seats.length > requestedBus.capacity) {
      return res.status(400).send({ 
        success: false, 
        message: 'Not enough seats available' 
      });
    }

    const newBookedSeats = [...currentlyBookedSeats, ...seats.map(seat => seat.toString())];
    const isFullyBooked = newBookedSeats.length >= requestedBus.capacity;

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
    
    if (!bus.parentBus) {
      await Bus.deleteMany({ busGroupId: bus.busGroupId });
    } else {
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

// Admin endpoint to delete old completed buses
router.delete('/cleanup-old-buses', authMiddleware, async (req, res) => {
  try {
    const now = getCurrentTimeInLusaka();
    const busesToDelete = await Bus.find({
      status: 'Completed',
    });

    let deletedCount = 0;
    for (const bus of busesToDelete) {
      const journeyDate = new Date(bus.journeydate);
      const arrivalTimeMatch = bus.arrival ? bus.arrival.match(/(\d{1,2}):(\d{2})/) : null;
      if (arrivalTimeMatch) {
        const arrivalHours = parseInt(arrivalTimeMatch[1]);
        const arrivalMins = parseInt(arrivalTimeMatch[2]);
        const fullArrival = new Date(journeyDate);
        fullArrival.setHours(arrivalHours, arrivalMins, 0, 0);
        const deleteAfter = new Date(fullArrival.getTime() + 60 * 60 * 1000);
        if (now > deleteAfter) {
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
