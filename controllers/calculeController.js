const { Op } = require('sequelize');
const { Absence, User,Presence,Schedule } = require('../models');
const moment = require('moment');

exports.getAbsences = async (req, res) => {
  try {
    const { userId, month } = req.query;
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const sortBy = req.query.sortBy;
    const order = req.query.order;

    // Construct where clause
    const whereClause = {};

    // Add userId filter if provided
    if (userId) {
      whereClause.UserId = userId;
    }

    // Add month filter if provided, always using the current year
    if (month) {
      const currentYear = moment().year();
      const startDate = moment(`${currentYear}-${month}-01`, 'YYYY-MM-DD').startOf('month');
      const endDate = moment(startDate).endOf('month');

      whereClause.date = {
        [Op.between]: [startDate.toDate(), endDate.toDate()]
      };
    }

    // Calculate offset for pagination
    const offset = (page - 1) * (limit > 0 ? limit : 0);

    // Prepare order array based on sortBy
    let orderArray;
    if (sortBy === 'User.name') {
      orderArray = [[{ model: User, as: 'User' }, 'name', order]];
    } else {
      orderArray = [[sortBy, order]];
    }

    // Define the query options
    const queryOptions = {
      where: whereClause,
      include: [{ 
        model: User, 
        as: 'User',
        attributes: ['id', 'name'] 
      }],
      order: orderArray,
    };

    // Apply limit and offset only if limit is valid (greater than 0)
    if (limit > 0) {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    // Fetch absences with filtering, pagination, and sorting
    const absences = await Absence.findAndCountAll(queryOptions);

    // Calculate pagination details
    const totalItems = absences.count;
    const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 1;

    // Fix case where totalItems is equal to limit and page should not be 1
    const currentPage = totalItems <= limit ? 1 : page;

    // Send response
    return res.status(200).json({
       absences: absences.rows,
      pagination: {
        totalItems,
        totalPages,
        currentPage,
        limit: limit > 0 ? limit : totalItems, // Use totalItems as limit when no limit is applied
      }
    });

  } catch (error) {
    console.error('Error fetching absences:', error);
    return res.status(500).json({ message: error.message });
  }
};

exports.calculateTardiness = async (req, res) => {
  try {
    const { userId, month, page, limit, sortBy, order} = req.query;
    const currentYear = moment().year();

    let whereClause = {};
    if (month) {
      const startDate = moment(`${currentYear}-${month}-01`).startOf('month').toDate();
      const endDate = moment(startDate).endOf('month').toDate();
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }
    if (userId) {
      whereClause.UserId = userId;
    }

    let queryOptions = {
      where: whereClause,
      include: [
        {
          model: Schedule,
          attributes: ['morningStart', 'morningEnd', 'afternoonStart', 'afternoonEnd', 'isRecurring']
        },
        {
          model: User,
          attributes: ['name']
        }
      ],
    };

    // Handle sorting
    if (sortBy === 'userName') {
      queryOptions.order = [[User, 'name', sortOrder.toUpperCase()]];
    } else if (sortBy === 'date' || sortBy === 'entree' || sortBy === 'sortie' || sortBy === 'entree1' || sortBy === 'sortie1') {
      queryOptions.order = [[sortBy, order]];
    }
    // Note: We can't sort by totalTardiness as it's a calculated field

    // Add pagination only if limit is not -1
    if (parseInt(limit) !== -1) {
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const { count, rows: presences } = await Presence.findAndCountAll(queryOptions);

    let tardinessData = presences.map(presence => {
      const bool = getScheduleType(presence.Schedule);
      let totalTardiness = 0;
      if (bool) {
        totalTardiness = calculateTimeDifference(presence.Schedule.morningStart, presence.entree) +
                         calculateTimeDifference(presence.Schedule.morningEnd, presence.sortie);
      } else {
        totalTardiness = calculateTimeDifference(presence.Schedule.morningStart, presence.entree) +
                         calculateTimeDifference(presence.Schedule.morningEnd, presence.sortie) +
                         calculateTimeDifference(presence.Schedule.afternoonStart, presence.entree1) +
                         calculateTimeDifference(presence.Schedule.afternoonEnd, presence.sortie1);
      }
      return {
        date: presence.date,
        userName: presence.User.name,
        totalTardiness: formatMinutes(totalTardiness),
        rawTardiness: totalTardiness  // Adding this for sorting purposes
      };
    });

    // Handle sorting by totalTardiness if needed
    if (sortBy === 'totalTardiness') {
      tardinessData.sort((a, b) => {
        return sortOrder.toLowerCase() === 'asc' ? a.rawTardiness - b.rawTardiness : b.rawTardiness - a.rawTardiness;
      });
    }

    const response = {
      totalPages: parseInt(limit) === -1 ? 1 : Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      totalCount: count,
      tardinessData: tardinessData.map(({ date, userName, totalTardiness }) => ({ date, userName, totalTardiness })),
    };

    res.json(response);
  } catch (error) {
    console.error('Error calculating tardiness:', error);
    res.status(500).json({ message: 'Failed to calculate tardiness', error: error.message });
  }
};

function getScheduleType(schedule) {
 if(schedule.isRecuring){
  return ture
 }else{
  return false
 }
}

function calculateTimeDifference(scheduledTime, actualTime) {
  if (!scheduledTime || !actualTime) return 0;
  const scheduled = moment(scheduledTime, 'HH:mm:ss');
  const actual = moment(actualTime, 'HH:mm:ss');
  if (actual.isAfter(scheduled)) {
    return actual.diff(scheduled, 'minutes');
  }
  return 0;
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}