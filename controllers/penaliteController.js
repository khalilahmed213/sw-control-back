const { Absence, User } = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

// Create a new penalite
exports.createPenalite = async (req, res) => {
  try {
    const { raison, startDate, endDate, ScheduleId, UserId } = req.body;

    const penalite = await Absence.create({
      type: 'penalite',
      raison,
      startDate,
      endDate,
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
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortBy = req.query.sortBy || 'name';
    const sortDesc = req.query.sortDesc === 'true';
    const agentId = req.query.agentId ? parseInt(req.query.agentId, 10) : null;

    if (page < 1 || limit < 1) {
      return res.status(400).json({ message: 'Invalid pagination parameters' });
    }

    const offset = (page - 1) * limit;

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
      orderClause = [[{ model: Absence, as: 'Absences' }, sortBy, sortDesc ? 'DESC' : 'ASC']];
    } else {
      orderClause = [['name', sortDesc ? 'DESC' : 'ASC']]; // Default to sorting by name
    }

    const { count, rows } = await User.findAndCountAll({
      attributes: ['id', 'name'],
      where: whereClause,
      include: [
        {
          model: Absence,
          required: true, // Change this to true
          where: { type: 'penalite' },
          attributes: ['id', 'raison', 'startDate', 'endDate'],
        },
      ],
      order: orderClause,
      offset,
      limit,
      distinct: true, // Add this to get the correct count when using include
    });

    // Process the results to calculate `nbrDeJour` and format the response
    const result = rows.flatMap(user =>
      user.Absences.map(absence => {
        const nbrDeJour = moment(absence.endDate).diff(moment(absence.startDate), 'days') + 1;
        return {
          id: absence.id,
          userId: user.id, // Add the user ID to the returned object
          agent: user.name,
          startDate: absence.startDate,
          endDate: absence.endDate,
          nbrDeJour,
          raison: absence.raison,
        };
      })
    );

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    // Send the penalites and pagination data as a JSON response
    res.json({
      total: count,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching penalites:', error);
    res.status(500).json({ message: 'Failed to fetch penalites', error: error.message });
  }
};

// Get a specific penalite by ID

// Update a penalite
exports.updatePenalite = async (req, res) => {
  try {
    const { id } = req.params;
    const { raison, startDate, endDate, ScheduleId, UserId } = req.body;

    const penalite = await Absence.findOne({
      where: { id, type: 'penalite'}
    });

    if (!penalite) {
      return res.status(404).json({ error: 'Penalite not found' });
    }

    penalite.raison = raison || penalite.raison;
    penalite.startDate = startDate || penalite.startDate;
    penalite.endDate = endDate || penalite.endDate;
    penalite.ScheduleId = ScheduleId || penalite.ScheduleId;
    penalite.UserId = UserId || penalite.UserId;

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
 
    const penalite = await Absence.findOne({
      where: { id, type: 'penalite'}
    });

    if (!penalite) {
      return res.status(404).json({ error: 'Penalite not found' });
    }

    await penalite.destroy();

    res.status(204).json();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};