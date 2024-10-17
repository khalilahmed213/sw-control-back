const cron = require('node-cron');
const { Schedule } = require('../models');
const { Op } = require('sequelize');

async function updateSchedule() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Find a schedule that matches today's date
    const matchingSchedule = await Schedule.findOne({
      where: {
        startDate: { [Op.gte]: today },
        endDate: { [Op.lte]: today }
      }
    });

    if (matchingSchedule) {
      // Set the matching schedule as selected
      await Schedule.update({ isSelected: false }, { where: {} });
      await matchingSchedule.update({ isSelected: true });
      console.log(`Schedule ${matchingSchedule.id} set as selected for ${today}`);
    } else {
      // If no matching schedule, set schedule with id 34 as selected
      await Schedule.update({ isSelected: false }, { where: {} });
      const defaultSchedule = await Schedule.findByPk(1);
      if (defaultSchedule) {
        await defaultSchedule.update({ isSelected: true });
        console.log(`Default schedule (id: 1) set as selected for ${today}`);
      } else {
        console.log('Default schedule (id: 1) not found');
      }
    }
  } catch (error) {
    console.error('Error updating schedule:', error);
  }
}

// Run the cron job every day at midnight
cron.schedule('0 0 * * *', updateSchedule);

module.exports = { updateSchedule };