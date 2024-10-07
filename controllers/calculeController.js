const { Op } = require("sequelize");
const { Absence, User, Presence, Schedule } = require("../models");
const moment = require("moment");
const presence = require("../models/presence");

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
      const startDate = moment(
        `${currentYear}-${month}-01`,
        "YYYY-MM-DD"
      ).startOf("month");
      const endDate = moment(startDate).endOf("month");

      whereClause.date = {
        [Op.between]: [startDate.toDate(), endDate.toDate()],
      };
    }

    // Calculate offset for pagination
    const offset = (page - 1) * (limit > 0 ? limit : 0);

    // Prepare order array based on sortBy
    let orderArray;
    if (sortBy === "User.name") {
      orderArray = [[{ model: User, as: "User" }, "name", order]];
    } else {
      orderArray = [[sortBy, order]];
    }

    // Define the query options
    const queryOptions = {
      where: whereClause,
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "name"],
        },
      ],
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
      },
    });
  } catch (error) {
    console.error("Error fetching absences:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getRetardData = async (req, res) => {
    try {
      const { userId, month } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortBy = req.query.sortBy || 'date';
      const order = req.query.order || 'DESC';
  
      // Construct where clause
      const whereClause = {};
  
      // Add userId filter if provided
      if (userId) {
        whereClause.UserId = userId;
      }
  
      // Add month filter if provided, always using the current year
      if (month) {
        const currentYear = moment().year();
        const startDate = moment(`${currentYear}-${month}-01`, "YYYY-MM-DD").startOf("month");
        const endDate = moment(startDate).endOf("month");
  
        whereClause.date = {
          [Op.between]: [startDate.toDate(), endDate.toDate()],
        };
      }
  
      let orderArray;
      if (sortBy === "User.name") {
        orderArray = [[{ model: User, as: "User" }, "name", order]];
      } else {
        orderArray = [[sortBy, order]];
      }
      const offset = (page - 1) * limit;
  
      // Get total count and fetch paginated data
      const { rows, count } = await Presence.findAndCountAll({
        where: whereClause,
        attributes: ["retardm", "retardam", "retardtotal", "date"],
        include: [
          {
            model: User,
            as: "User",
            attributes: ["name"],
          },
        ],
        order: orderArray,
        limit: limit,
        offset: offset
      });
  
      res.status(200).json({
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        records: rows,
      });
    } catch (error) {
      console.error("Error fetching retard data: ", error);
      res.status(500).json({ error: "An error occurred while fetching retard data" });
    }
  };

function getScheduleType(schedule) {
  if (schedule.isRecuring) {
    return ture;
  } else {
    return false;
  }
}

function calculateTimeDifference(scheduledTime, actualTime) {
  if (!scheduledTime || !actualTime) return 0;
  const scheduled = moment(scheduledTime, "HH:mm:ss");
  const actual = moment(actualTime, "HH:mm:ss");
  if (actual.isAfter(scheduled)) {
    return actual.diff(scheduled, "minutes");
  }
  return 0;
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
