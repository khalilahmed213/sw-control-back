const { Penalite, User, Schedule } = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

// Create a new penalite
exports.createPenalite = async (req, res) => {
  try {
    const { raison, startDate, endDate, ScheduleId, UserId } = req.body;

    // Calculate nbrDeJour
    const nbrDeJour = moment(endDate).diff(moment(startDate), 'days') + 1;

    const penalite = await Penalite.create({
      raison,
      startDate,
      endDate,
      nbrDeJour,
      ScheduleId,
      UserId
    });

    res.status(201).json(penalite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all penalites with pagination, sorting, and filtering
exports.getPenalites = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    const sortBy = req.query.sortBy || 'name';
    const sortDesc = req.query.sortDesc === 'true';
    const agentId = req.query.agentId ? parseInt(req.query.agentId, 10) : null;

    if (limit !== -1 && (page < 1 || limit < 1)) {
      return res.status(400).json({ message: 'Invalid pagination parameters' });
    }

    const whereClause = {
      role: 'employe',
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } } 
      ]
    };

    if (agentId) {
      whereClause.id = agentId;
    }

    // Adjust the orderClause based on the sortBy value
    let orderClause;
    if (sortBy === 'agent') {
      orderClause = [['name', sortDesc ? 'DESC' : 'ASC']];
    } else if (['startDate', 'endDate', 'raison'].includes(sortBy)) {
      orderClause = [[{ model: Penalite, as: 'Penalites' }, sortBy, sortDesc ? 'DESC' : 'ASC']];
    } else {
      orderClause = [['name', sortDesc ? 'DESC' : 'ASC']]; // Default to sorting by name
    }

    const queryOptions = {
      attributes: ['id', 'name'],
      where: whereClause,
      include: [
        {
          model: Penalite,
          required: true, 
          attributes: ['id', 'raison', 'startDate', 'endDate'],
        },
      ],
      order: orderClause,
      distinct: true, // Add this to get the correct count when using include
    };

    // Apply pagination only if limit is not -1
    if (limit !== -1) {
      const offset = (page - 1) * limit;
      queryOptions.offset = offset;
      queryOptions.limit = limit;
    }

    const { count, rows } = await User.findAndCountAll(queryOptions);

    // Process the results to calculate nbrDeJour and format the response
    const result = rows.flatMap(user =>
      user.Penalites.map(Penalite => {
        const nbrDeJour = moment(Penalite.endDate).diff(moment(Penalite.startDate), 'days') + 1;
        return {
          id: Penalite.id,
          UserId: user.id,
          agent: user.name,
          startDate: Penalite.startDate,
          endDate: Penalite.endDate,
          nbrDeJour,
          raison: Penalite.raison,
        };
      })
    );

    // Calculate pagination details
    const totalItems = result.length;
    const totalPages = limit === -1 ? 1 : Math.ceil(count / limit);

    // Adjust limit for response if it was -1
    if (limit === -1) {
      limit = totalItems;
    }

    // Send the penalites and pagination data as a JSON response
    res.json({
      total: totalItems,
      totalPages,
      currentPage: limit === totalItems ? 1 : page,
      itemsPerPage: limit,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching penalites:', error);
    res.status(500).json({ message: 'Failed to fetch penalites', error: error.message });
  }
};

// Update a penalite
exports.updatePenalite = async (req, res) => {
  try {
    const { id } = req.params;
    const { raison, startDate, endDate, ScheduleId, UserId } = req.body;

    const penalite = await Penalite.findByPk(id);

    if (!penalite) {
      return res.status(404).json({ error: 'Penalite not found' });
    }

    penalite.raison = raison || penalite.raison;
    penalite.startDate = startDate || penalite.startDate;
    penalite.endDate = endDate || penalite.endDate;
    penalite.ScheduleId = ScheduleId || penalite.ScheduleId;
    penalite.UserId = UserId || penalite.UserId;

    // Recalculate nbrDeJour if startDate or endDate changed
    if (startDate || endDate) {
      penalite.nbrDeJour = moment(penalite.endDate).diff(moment(penalite.startDate), 'days') + 1;
    }

    await penalite.save();

    res.status(200).json(penalite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a penalite
exports.deletePenalite = async (req, res) => {
  try {
    const { id } = req.params;
 
    const penalite = await Penalite.findByPk(id);

    if (!penalite) {
      return res.status(404).json({ error: 'Penalite not found' });
    }

    await penalite.destroy();

    res.status(204).json();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};