const { Schedule } = require('../models');
const { Op } = require('sequelize');

exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.findAll();
    res.json(schedules);
  } catch (error) {
    console.error('Erreur lors de la récupération des horaires:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des horaires' });
  }
};
exports.createSchedule = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'La date de début et la date de fin sont requises' });
    }

    const overlappingSchedule = await Schedule.findOne({
      where: {
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });

    if (overlappingSchedule) {
      return res.status(400).json({ success: false, message: 'Les dates sélectionnées se chevauchent avec un horaire existant' });
    }
    await Schedule.create(req.body)
    res.status(201).json({ success: true, message: "Horaire créé avec succès" });
  } catch (error) {
    console.error('Erreur lors de la création de l\'horaire:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'horaire' });
  }
};

// Update a schedule
exports.updateSchedule = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.body; // Added to check for overlapping schedules
  try {
    // Check for overlapping schedules with a different id
    const overlappingSchedule = await Schedule.findOne({
      where: {
        id: { [Op.ne]: id }, // Ensure it's a different schedule
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });

    if (overlappingSchedule) {
      return res.status(400).json({ success: false, message: 'Les dates sélectionnées se chevauchent avec un horaire existant' }); // Overlapping message
    }

    const [updated] = await Schedule.update(req.body, {
      where: { id }
    });
    if (updated) {
      res.json({ success: true, message: "Horaire mis à jour avec succès" }); // Updated message
    } else {
      res.status(404).json({ success: false, message: "Horaire non trouvé" }); // Updated message
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'horaire:', error); // Updated message
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l\'horaire' }); // Updated message
  }
};

// Delete a schedule
exports.deleteSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Schedule.destroy({
      where: { id }
    });
    if (deleted) {
      res.json({ success: true, message: "Horaire supprimé avec succès" }); // Updated message
    } else {
      res.status(404).json({ success: false, message: 'Horaire non trouvé' }); // Updated message
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de l\'horaire' }); // Updated message
  }
};

// Toggle isSelected for a schedule
exports.toggleSelected = async (req, res) => {
  const { id } = req.params;
  try {
      const selectedSchedule = await Schedule.findOne({ where: { id } });
      if (!selectedSchedule) {
        return res.status(404).json({ error: 'Horaire non trouvé' }); // Updated message
      }

      // Update the selected schedule
      await selectedSchedule.update({ isSelected: true });

      // Set isSelected to false for all other schedules
      await Schedule.update(
        { isSelected: false },
        { where: { id: { [Op.ne]: id } } }
      );

    res.json({ message: 'Succès' }); // Updated message
  } catch (error) {
    console.error('Erreur lors du changement de sélection :', error); // Updated message
    res.status(500).json({ error: 'Erreur lors du changement de sélection' }); // Updated message
  }
};
exports.checkIfScheduleIsRecurring=async(req,res)=>{
  const { id } = req.params; 

  try {
    const schedule = await Schedule.findOne({
      where: { id: id },
      attributes: ['isRecurring'],
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Horaire non trouvé' }); // Updated message
    }
 
    return res.json({ isRecurring: schedule.isRecurring });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'horaire:', error); // Updated message
    return res.status(500).json({ error: 'Une erreur est survenue lors de la vérification de l\'horaire' }); // Updated message
  }
}
exports.getCurrentSchedule=async(req,res)=>{
  const schedule = await Schedule.findOne({
    where: { isSelected:true },
    attributes: ['id'],
  });
return res.json({schedule})
}