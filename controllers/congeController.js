const { Conge, User,UserInfo } = require('../models');
const moment = require('moment');

// Create a new conge
exports.createConge = async (req, res) => {
  try {
    const { startDate, endDate, UserId, raison } = req.body; // Added raison
    const reference = `C-${moment().format('DDMMYYYYHHmmss')}`; // Unique reference based on timestamp
    const nbrDeJour = moment(endDate).diff(moment(startDate), 'days') + 1; // Calculate number of days

    await Conge.create({
      startDate,
      endDate,
      reference,
      nbrDeJour,
      status: 'en attente',
      UserId,
      raison // Added raison
    });

    res.status(201).json({ message: 'Conge ajouté avec succès' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.getAllConges = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder, UserId } = req.query;
    const whereClause = {};

    // Add filter by UserId if provided
    if (UserId && !isNaN(parseInt(UserId, 10))) {
      whereClause.UserId = UserId;
    } 

    // Construct the order array based on sortBy and sortOrder
    let order = [];
    if (sortBy === 'User.name') {
      order = [[{ model: User, as: 'User' }, 'name', sortOrder]];
    } else {
      order = [[sortBy, sortOrder]];
    }

    // Construct query options
    const queryOptions = {
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'User', 
          attributes: ['id', 'name'], 
        }
      ],
      order: order // Use the constructed order array
    };

    // Handle pagination if both page and limit are valid
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);

    if (!isNaN(pageInt) && !isNaN(limitInt) && limitInt > 0) {
      const offset = (pageInt - 1) * limitInt;
      queryOptions.limit = limitInt;
      queryOptions.offset = offset;
    }

    // Fetch conges with filtering, pagination, and sorting
    const conges = await Conge.findAndCountAll(queryOptions);

    // Calculate pagination details
    const totalItems = conges.count;
    const totalPages = limitInt > 0 ? Math.ceil(totalItems / limitInt) : 1;
    const currentPage = pageInt > 0 ? pageInt : 1;

    // Send response
    res.json({
      conges: conges.rows,
      totalPages,
      currentPage,
      totalItems
    });
  } catch (error) {
    console.error('Error in getAllConges:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update a conge
exports.updateConge = async (req, res) => {
  try {
    const { startDate, endDate, status, raison } = req.body; // Added raison
    const conge = await Conge.findByPk(req.params.id);
    if (conge) {
      await conge.update({ startDate, endDate, status, raison }); // Added raison
      res.json({ message: 'Conge modifié avec succès' });
    } else {
      res.status(404).json({ message: 'Conge not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a conge
exports.deleteConge = async (req, res) => {
  try {
    const conge = await Conge.findByPk(req.params.id);
    if (conge) {
      await conge.destroy();
      res.json({ message: 'Conge supprimé avec succès' });
    } else {
      res.status(404).json({ message: 'Conge not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get conges for a specific user
exports.getUserConges = async (req, res) => {
  try {
    const UserId = req.query.UserId;
    const page = parseInt(req.query.page); 
    const limit = parseInt(req.query.limit) ; 
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder; 

    if (!UserId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const offset = (page - 1) * limit; // Calculate offset for pagination

    const conges = await Conge.findAndCountAll({
      where: { UserId },
      include: [{ model: User, as: 'User', attributes: ['id', 'name'] }],
      order: [[sortBy, sortOrder]], 
      limit: limit, 
      offset: offset, 
    });

    res.json({
      conges: conges.rows,
      totalPages: Math.ceil(conges.count / limit),
      currentPage: page,
      totalItems: conges.count
    });
  } catch (error) {
    console.error('Error in getUserConges:', error);
    res.status(500).json({ message: error.message });
  }
};
exports.toggleCongeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;

    if (!['accepté', 'en attente', 'rejeté'].includes(newStatus))  {
      return res.status(400).json({ message: 'Invalid status. Must be "en attente", "approuvé", or "rejeté".' });
    }

    const conge = await Conge.findByPk(id);

    if (!conge) {
      return res.status(404).json({ message: 'Conge not found' });
    }

    await conge.update({ status: newStatus });

    res.json({ message: 'Conge status updated successfully' });
  } catch (error) {
    console.error('Error in toggleCongeStatus:', error);
    res.status(500).json({ message: error.message });
  }
};