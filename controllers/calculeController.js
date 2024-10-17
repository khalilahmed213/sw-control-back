const { Op } = require('sequelize');
const { User, Penalite, Absence, Autorisation, Presence,Project,Conge,UserInfo } = require('../models');
const moment = require('moment');

exports.getRetardData = async (req, res) => {
  try {
    const { userId, month } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 31; // Set default limit to 31 to potentially show a full month
    const sortBy = req.query.sortBy || "date";
    const order = req.query.order || "ASC"; // Changed to ASC to show dates in chronological order

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
        "DD-MM-YYYY"
      ).startOf("month");
      const endDate = moment(startDate).endOf("month");

      whereClause.date = {
        [Op.between]: [startDate.toDate(), endDate.toDate()],
      };
    }

    let orderArray;
    if (sortBy === "User.name") {
      orderArray = [
        [{ model: User, as: "User" }, "name", order],
        ["date", "ASC"],
      ];
    } else {
      orderArray = [[sortBy, order]];
    }
    const offset = (page - 1) * limit;
    const { rows, count } = await Presence.findAndCountAll({
      where: whereClause,
      attributes: ["id", "retardm", "retardam", "retardtotal", "date"],
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "name", "email"],
        },
      ],
      order: orderArray,
      limit: limit,
      offset: offset,
    });

    // Format the retard data
    const formattedRows = rows.map((row) => {
      const formatRetard = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
      };

      return {
        date: moment(row.date).format("YYYY-MM-DD"),
        User: {
          name: row.User.name,
        },
        retardm: formatRetard(row.retardm),

        retardam: formatRetard(row.retardam),
        retardtotal: formatRetard(row.retardtotal),
      };
    });

    res.status(200).json({
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      records: formattedRows,
    });
  } catch (error) {
    console.error("Error fetching retard data: ", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching retard data" });
  }
};
exports.calculateLeaveBalance = async (req, res) => {
  try {
    const { month, userId, page = 1, limit = 10, sortBy, order = 'asc' } = req.query;
    const currentYear = moment().year();

    // Prepare query conditions
    const userWhereClause = { role: 'employe', ...(userId && { id: parseInt(userId) }) };
    const presenceWhereClause = month ? {
      date: {
        [Op.between]: [
          moment(`${currentYear}-${month}-01`).startOf('month').toDate(),
          moment(`${currentYear}-${month}-01`).endOf('month').toDate()
        ]
      }
    } : {};

    // Optimize pagination
    const paginationOptions = limit === '-1' ? {} : {
      offset: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit)
    };

    // Perform a single query to fetch all required data
    const { count, rows: users } = await User.findAndCountAll({
      where: userWhereClause,
      include: [
        { model: Penalite, attributes: ['nbrDeJour'] },
        { model: Absence, attributes: ['id'] },
        { model: Autorisation, attributes: ['heureDebut', 'heureFin'] },
        { 
          model: Presence,
          where: presenceWhereClause,
          attributes: ['retardtotal']
        },
        { model: Conge, where: { status: 'accepté' }, required: false, attributes: ['nbrDeJour'] },
        { model: UserInfo, attributes: ['months', 'soldeAncienConge'] }
      ],
      ...paginationOptions,
      distinct: true,
      attributes: ['name', 'id']  // Added 'id' to ensure we have a unique identifier
    });

    // Calculate leave balances
      let leaveBalances = users.map(user => {
      const monthsDone = user.UserInfo?.months || 0;
      const oldLeaveBalance = user.UserInfo?.soldeAncienConge || 0;
      const penaltiesDays = user.Penalites?.reduce((sum, penalty) => sum + (penalty.nbrDeJour || 0), 0) || 0;
      const absencesDays = user.Absences?.length || 0;

      // Calculate tardiness
    

      const totalTardiness = user.Presences?.reduce((sum, presence) => sum + (presence.retardtotal || 0), 0) || 0;
      const tardinessDays = Math.floor(totalTardiness / (8 * 60)) || 0;

      // Calculate authorized absences
      const authorizedAbsenceDays = Math.floor(user.Autorisations?.reduce((sum, auth) => {
        if (!auth.heureDebut || !auth.heureFin) return sum;
        return sum + moment.duration(moment(auth.heureFin).diff(moment(auth.heureDebut))).asHours();
      }, 0) / 8) || 0;

      const totalSanctions = penaltiesDays + absencesDays + tardinessDays + authorizedAbsenceDays;
      const leavesTaken = user.Conges?.reduce((sum, conge) => sum + (conge.nbrDeJour || 0), 0) || 0;
      const earnedLeave = monthsDone * 1.75;
      const leaveBalance = earnedLeave + oldLeaveBalance - totalSanctions;
      return {
        id: user.id,
        name: user.name,
        monthsDone,
        SOLDECONGE: Math.max(0, Math.round(earnedLeave * 100) / 100),
        CONGEPRISE: leavesTaken,
        sanction: Math.round(totalSanctions * 100) / 100,
        RESTCONGE: Math.max(0, Math.round(leaveBalance * 100) / 100),
        RESTANCIENCONGE: oldLeaveBalance
      };
    });

    // Apply sorting if sortBy is provided
    if (sortBy && leaveBalances.length > 0 && leaveBalances[0].hasOwnProperty(sortBy)) {
      leaveBalances.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return order === 'asc' ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Prepare pagination metadata
    const totalPages = limit === '-1' ? 1 : Math.ceil(count / parseInt(limit));
    const currentPage = parseInt(page);

    res.json({
      leaveBalances,
      pagination: {
        totalItems: count,
        itemsPerPage: limit === '-1' ? count : parseInt(limit),
        currentPage: currentPage,
        totalPages: totalPages
      }
    });
  } catch (error) {
    console.error('Error calculating leave balances:', error);
    res.status(500).json({ message: 'Failed to calculate leave balances', error: error.message });
  }
};
exports.calculateLeaveBalanceForUser = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const currentYear = moment().year();

    // Perform a single query to fetch all required data
    const user = await User.findOne({
      where: { id: userId, role: 'employe' },
      include: [
        { model: Penalite, attributes: ['nbrDeJour'] },
        { model: Absence, attributes: ['id'] },
        { model: Autorisation, attributes: ['heureDebut', 'heureFin'] },
        { 
          model: Presence,
          attributes: ['retardtotal'],
          required: false
        },
        { model: Conge, required: false },
        { model: UserInfo, attributes: ['months', 'soldeAncienConge'] },
        { model: Project, through: 'UserProject', attributes: ['name'] } // Add this line
      ],
      attributes: ['name', 'id']
    });
  
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  const projects= user.Projects.map(project => ({
      name: project.name
    }))
    // Calculate leave balance
    const monthsDone = user.UserInfo?.months || 0;
    const oldLeaveBalance = user.UserInfo?.soldeAncienConge || 0;
    const penaltiesDays = user.Penalites?.reduce((sum, penalty) => sum + (penalty.nbrDeJour || 0), 0) || 0;
    const absencesDays = user.Absences?.length || 0;
    
    // Calculate tardiness using retardtotal
    const totalTardiness = user.Presences?.reduce((sum, presence) => sum + (presence.retardtotal || 0), 0) || 0;
    const tardinessDays = Math.floor(totalTardiness / (8 * 60)) || 0;
    
    // Calculate authorized absences
    const authorizedAbsenceDays = Math.floor(user.Autorisations?.reduce((sum, auth) => {
      if (!auth.heureDebut || !auth.heureFin) return sum;
      return sum + moment.duration(moment(auth.heureFin).diff(moment(auth.heureDebut))).asHours();
    }, 0) / 8) || 0;
    
    const totalSanctions = penaltiesDays + absencesDays + tardinessDays + authorizedAbsenceDays;
    
    
    const leavesTaken = user.Conges?.reduce((sum, conge) => sum + (conge.nbrDeJour || 0), 0) || 0;
    
    
    const earnedLeave = monthsDone * 1.75;
    const leaveBalance = earnedLeave + oldLeaveBalance - totalSanctions;

    const leaveBalanceData = {
      id: user.id,
      name: user.name,
      monthsDone,
      SOLDECONGE: Math.max(0, Math.round(earnedLeave * 100) / 100),
      CONGEPRISE: leavesTaken,
      sanction: Math.round(totalSanctions * 100) / 100,
      RESTCONGE: Math.max(0, Math.round(leaveBalance * 100) / 100),
      RESTANCIENCONGE: oldLeaveBalance,
      conges: user.Conges,
      projects: projects
    };

    res.json(leaveBalanceData);
  } catch (error) {
    console.error('Error calculating leave balance for user:', error);
    res.status(500).json({ message: 'Failed to calculate leave balance for user', error: error.message });
  }
};
exports.getAbsences = async (req, res) => {
  try {
    const { userId, month, page = 1, limit: rawLimit = 10, sortBy = 'startDate', order = 'asc' } = req.query;
    const limit = parseInt(rawLimit);

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

    // Define the query options
    const queryOptions = {
      where: whereClause,
      include: [{ 
        model: User, 
        as: 'User',
        attributes: ['id', 'name'] 
      }],
      order: [['UserId', 'ASC'], ['date', 'ASC']], // Always sort by UserId then date for grouping
    };

    // Fetch all absences without pagination
    const allAbsences = await Absence.findAll(queryOptions);

    // Group absences
    let groupedAbsences = groupAbsences(allAbsences);

    // Sort grouped absences
    groupedAbsences = sortGroupedAbsences(groupedAbsences, sortBy, order);

    // Apply pagination to grouped absences if limit is not -1
    const totalItems = groupedAbsences.length;
    let paginatedAbsences, totalPages, currentPage;

    if (limit === -1) {
      // Return all elements without pagination
      paginatedAbsences = groupedAbsences;
      totalPages = 1;
      currentPage = 1;
    } else {
      // Apply pagination
      totalPages = Math.ceil(totalItems / limit);
      currentPage = page;
      const offset = (currentPage - 1) * limit;
      paginatedAbsences = groupedAbsences.slice(offset, offset + limit);
    }

    // Send response
    return res.status(200).json({
      absences: paginatedAbsences,
      pagination: {
        totalItems,
        totalPages,
        currentPage,
        limit: limit === -1 ? totalItems : limit,
      }
    });

  } catch (error) {
    console.error('Error fetching absences:', error);
    return res.status(500).json({ message: error.message });
  }
};

function groupAbsences(absences) {
  const groupedAbsences = [];
  let currentGroup = null;

  for (const absence of absences) {
    const currentDate = moment(absence.date);

    if (!currentGroup || 
        currentGroup.UserId !== absence.UserId || 
        currentDate.diff(moment(currentGroup.endDate), 'days') > 1) {
      if (currentGroup) {
        // Calculate the number of days for the group
        currentGroup.days = moment(currentGroup.endDate).diff(moment(currentGroup.startDate), 'days') + 1;
        groupedAbsences.push(currentGroup);
      }
      currentGroup = {
        UserId: absence.UserId,
        name: absence.User.name,
        startDate: absence.date,
        endDate: absence.date,
        raison: absence.raison,
        days: 1 // Default to 1 day when creating a new group
      };
    } else {
      currentGroup.endDate = absence.date;
    }
  }

  if (currentGroup) {
    // Ensure the last group is added
    currentGroup.days = moment(currentGroup.endDate).diff(moment(currentGroup.startDate), 'days') + 1;
    groupedAbsences.push(currentGroup);
  }

  return groupedAbsences;
}

function sortGroupedAbsences(absences, sortBy, order) {
  return absences.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'startDate':
      case 'endDate':
        comparison = moment(a[sortBy]).diff(moment(b[sortBy]));
        break;
      case 'raison':
        comparison = a.raison.localeCompare(b.raison);
        break;
      case 'days':
        comparison = a.days - b.days;
        break;
      default:
        comparison = 0;
    }
    return order.toLowerCase() === 'asc' ? comparison : -comparison;
  });
}
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
