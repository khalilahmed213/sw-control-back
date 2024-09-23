const { Autorisation, User, Absence } = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

// Create a new autorisation
exports.createAutorisation = async (req, res) => {
  try {
    const lastAutorisation = await Autorisation.findOne({
      order: [['id', 'DESC']],
    });

    const autorisationId = lastAutorisation ? lastAutorisation.id + 1 : 1;
    const currentDate = moment().format('DD-MM-YYYY');
    const référence = `A-${autorisationId}-${currentDate}`;
    const { userId, date, heureDebut, heureFin } = req.body;
    
    const calculateNbrHeure = (startTime, endTime) => {
      const start = moment(startTime, 'HH:mm');
      const end = moment(endTime, 'HH:mm');
      return end.diff(start, 'minutes'); 
    };
    const nbrheures = calculateNbrHeure(heureDebut, heureFin);
    
    const autorisation = await Autorisation.create({
      référence,
      userId,
      date,
      heureDebut,
      heureFin,
      nbrheures,
      status: 'en attente'
    });

    // Create associated Absence record
    await Absence.create({
      type: 'autorisation',
      startDate: date,
      endDate: date,
      raison: 'Autorisation',
      absenceable: 'Autorisation',
      absenceableId: autorisation.id
    });

    res.status(201).json({message: 'Autorisation ajoutée avec succès'});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Other methods remain largely the same, but we need to update the delete method

// Delete an autorisation
exports.deleteAutorisation = async (req, res) => {
  try {
    const autorisation = await Autorisation.findByPk(req.params.id);
    if (autorisation) {
      // Delete associated Absence record
      await Absence.destroy({
        where: {
          absenceable: 'Autorisation',
          absenceableId: autorisation.id
        }
      });

      await autorisation.destroy();
      res.json({ message: 'Autorisation supprimée avec succès' });
    } else {
      res.status(404).json({ message: 'Autorisation not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an autorisation
exports.updateAutorisation = async (req, res) => {
  try {
    const { reference, agentId, dateAutorisation, heureDebut, heureFin, nbrheures, status } = req.body;
    const autorisation = await Autorisation.findByPk(req.params.id);
    if (autorisation) {
      await autorisation.update({
        reference,
        agentId,
        dateAutorisation,
        heureDebut,
        heureFin,
        nbrheures,
        status
      });

      // Update associated Absence record
      await Absence.update({
        startDate: dateAutorisation,
        endDate: dateAutorisation,
      }, {
        where: {
          absenceable: 'Autorisation',
          absenceableId: autorisation.id
        }
      });

      res.json({message: 'Autorisation modifiée avec succès'});
    } else {
      res.status(404).json({ message: 'Autorisation not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.getAllAutorisations = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder, agentId } = req.query;
    const whereClause = {};
    if (agentId && !isNaN(parseInt(agentId, 10))) {
      whereClause.userId = parseInt(agentId, 10);
    }

    let order = [];
    if (sortBy === 'User.name') {
      order = [[{ model: User, as: 'User' }, 'name', sortOrder]];
    } else {
      order = [[sortBy, sortOrder]];
    }

    const queryOptions = {
      where: whereClause,
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name']
      }],
      order: order // Use updated order
    };

    // Add pagination if both page and limit are provided
    if (page && limit) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = offset;
    }

    const autorisations = await Autorisation.findAndCountAll(queryOptions);

    res.json({
      autorisations: autorisations.rows,
      totalPages: limit ? Math.ceil(autorisations.count / parseInt(limit)) : 1,
      currentPage: page ? parseInt(page) : 1,
      totalItems: autorisations.count
    });
  } catch (error) {
    console.error('Error in getAllAutorisations:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// Toggle autorisation status
exports.toggleAutorisationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;
    if (!['accepté', 'en attente', 'rejeté'].includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid status. Must be "accepté", "en attente", or "rejeté".' });
    }

    const autorisation = await Autorisation.findByPk(id);

    if (!autorisation) {
      return res.status(404).json({ message: 'Autorisation not found' });
    }

    await autorisation.update({ status: newStatus });

    res.json({ message: 'Autorisation status updated successfully' });
  } catch (error) {
    console.error('Error in toggleAutorisationStatus:', error);
    res.status(500).json({ message: error.message });
  }
};