const { Presence, Absence, User,Schedule } = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

const presenceController = {
  
    async updatePresence(req, res) {
      try {
        const { UserId, environnement, entree, sortie, entree1, sortie1, commentaires, absence, ScheduleId , createdAtdate} = req.body;
        const parsedDate = moment(createdAtdate, 'YYYY-MM-DD').startOf('day').toDate();
        const endOfDay = moment(createdAtdate, 'YYYY-MM-DD').endOf('day').toDate();
        const calculateProduction = (startTime, endTime) => {
          const start = moment(startTime, 'HH:mm');
          const end = moment(endTime, 'HH:mm');
          return end.diff(start, 'minutes'); 
        };
        const absenceRecord = await Absence.findOne({
          where: {
            UserId: UserId,
            createdAt: {
              [Op.gte]: parsedDate,
              [Op.lte]: endOfDay,
            },
          }
        }); 
        
        const presenceRecord = await Presence.findOne({
          where: {
            UserId: UserId,
            createdAt: {
              [Op.gte]: parsedDate,
              [Op.lte]: endOfDay,
            },
          },
        }); 
  
        if (absence === 'Absent') {
          if (absenceRecord) {
            // Update existing absence record
            await Absence.update({
              raison: commentaires,
              startDate: parsedDate,
              endDate: endOfDay,
              ScheduleId: ScheduleId
            }, {
              where: {
                id: absenceRecord.id
              }
            });
          } else {
            // Create new absence record
            await Absence.create({
              type: 'absence',
              raison: commentaires,
              startDate: parsedDate,
              endDate: endOfDay,
              ScheduleId: ScheduleId,
              UserId: UserId,
              createdAt:  createdAtdate
            });
          }
  
          // Remove presence record if it exists
          if (presenceRecord) {
            await Presence.destroy({
              where: {
                UserId: UserId,
                createdAt: {
                  [Op.gte]:  parsedDate ,
                  [Op.lte]: endOfDay
                }
              }
            });
          }
  
          return res.status(201).json({ message: 'Absence recorded successfully' });
        } 
        
        if (absence === 'Présent') {
          if (presenceRecord) {
            const prodMatin = entree && sortie ? calculateProduction(entree, sortie) : 0;
            const prodApresMidi = entree1 && sortie1 ? calculateProduction(entree1, sortie1) : 0;
            const prod = prodMatin + prodApresMidi;
            // Update existing presence record
            await Presence.update({
              environnement,
              entree,
              sortie,
              entree1,
              sortie1,
              prod,
              prodMatin,
              prodApresMidi,
              commentaires
            }, {
              where: {
                id: presenceRecord.id
              }
            });
          } else {
            // Create new presence record
             const prodMatin = entree && sortie ? calculateProduction(entree, sortie) : 0;
             const prodApresMidi = entree1 && sortie1 ? calculateProduction(entree1, sortie1) : 0;
             const prod = prodMatin + prodApresMidi;
            await Presence.create({
              environnement,
              entree,
              sortie,
              entree1,
              sortie1,
              prod,
              prodMatin,
              prodApresMidi,
              commentaires,
              UserId: UserId,
              ScheduleId: ScheduleId,
              createdAt:  createdAtdate
            });
          }
  
          // Remove absence record if it exists
          if (absenceRecord) {
            await Absence.destroy({
              where: {
                UserId: UserId,
                createdAt: {
                  [Op.gte]:  parsedDate ,
                  [Op.lte]: endOfDay
                }
              }
            });
          }
  
          return res.status(201).json({ message: 'Presence recorded successfully' });
        } 
  
        return res.status(400).json({ message: 'Invalid absence status' });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    
  },

  async addPresence(req, res) {
    try {
      const { UserId, environnement, entree, sortie, entree1, sortie1, commentaires, absence, ScheduleId, createdAtdate } = req.body;
      const parsedDate = moment(createdAtdate, 'YYYY-MM-DD').startOf('day').toDate();
      const endOfDay = moment(createdAtdate, 'YYYY-MM-DD').endOf('day').toDate();
  
      // Helper function to calculate production time
      const calculateProduction = (startTime, endTime) => {
        const start = moment(startTime, 'HH:mm');
        const end = moment(endTime, 'HH:mm');
        return end.diff(start, 'minutes'); // Returns production time in minutes
      };
  
      if (absence === 'Absent') {
        await Absence.create({
          type: 'absence',
          raison: commentaires,
          startDate: parsedDate,
          endDate: endOfDay,
          ScheduleId: ScheduleId,
          UserId: UserId,
          createdAt: createdAtdate
        });
  
        return res.status(201).json({ message: 'Absence recorded successfully' });
      } else if(absence === 'Présent') {
        // Calculate production times
        const prodMatin = entree && sortie ? calculateProduction(entree, sortie) : 0;
        const prodApresMidi = entree1 && sortie1 ? calculateProduction(entree1, sortie1) : 0;
        const prod = prodMatin + prodApresMidi;
  console.log(prod)
        // Create presence record
        await Presence.create({
          environnement,
          entree,
          sortie,
          entree1,
          sortie1,
          prodMatin,
          prodApresMidi,
          prod,
          commentaires,
          UserId: UserId,
          ScheduleId: ScheduleId,
          createdAt: createdAtdate
        });
  
        return res.status(201).json({ message: 'Presence added successfully' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  },

  async getPresenceAndAbsence(req, res) {
    try {
      const { dateselect, page, itemsPerPage, sortBy, sortDesc } = req.query;
      if (!dateselect) {
        return res.status(400).json({ error: 'Date parameter is required' });
      }

      const parsedDate = moment(dateselect, 'YYYY-MM-DD').startOf('day').toDate();
      const endOfDay = moment(dateselect, 'YYYY-MM-DD').endOf('day').toDate();

      let order = [];
      if (sortBy && sortDesc) {
        order = [[sortBy, sortDesc === 'true' ? 'DESC' : 'ASC']];
      }

      const { count, rows: users } = await User.findAndCountAll({
        attributes: ['id', 'name'],
        where: { role: 'employe' },
        include: [
          {
            model: Presence,
            required: false,
            where: {
              createdAt: {
                [Op.gte]: parsedDate,
                [Op.lte]: endOfDay,
              },
            },
          },
          {
            model: Absence,
            required: false,
            where: {
              createdAt: {
                [Op.gte]: parsedDate,
                [Op.lte]: endOfDay,
              },
            },
          },
        ],
        order: order.length ? order : [['name', 'ASC']],
        limit: parseInt(itemsPerPage),
        offset: (page - 1) * itemsPerPage
      });

      let recordsFound = false;

      for (const user of users) {
        if ((user.Presences && user.Presences.length > 0) || 
            (user.Absences && user.Absences.length > 0)) {
          recordsFound = true;
          break; // No need to continue checking if we found records
        }
      }


      // Process the fetched data
      const result = await Promise.all(users.map(async (user) => {
        const presence = user.Presences[0];
        const absence = user.Absences[0];
        const isPresent = presence ? 'Présent' : (absence ? 'Absent' : 'N/A');
        const commentaires = presence ? presence.commentaires : (absence ? absence.raison : 'N/A');

        // Helper function to format minutes into hours and minutes
        const formatTime = (minutes) => {
          const hrs = Math.floor(minutes / 60);
          const mins = minutes % 60;
          return `${hrs}h ${mins}m`;
        };

        // Determine if the schedule is recurring
     /*    const ScheduleId = presence ? presence.ScheduleId : (absence ? absence.ScheduleId : null);
        if (ScheduleId && isRecurring === null) {
          const schedule = await Schedule.findByPk(ScheduleId);
          if (schedule) {
            isRecurring = schedule.isRecurring;
          }
        } */

        return {
          UserId: user.id,
          Agent: user.name,
          environnement: presence ? presence.environnement : 'N/A',
          absence: isPresent,
          entree: presence ? presence.entree : 'N/A',
          sortie: presence ? presence.sortie : 'N/A',
          entree1: presence ? presence.entree1 : 'N/A',
          sortie1: presence ? presence.sortie1 : 'N/A',
          prod: presence ? formatTime(presence.prod) : 'N/A',
          prodMatin: presence ? formatTime(presence.prodMatin) : 'N/A',
          prodApresMidi: presence ? formatTime(presence.prodApresMidi) : 'N/A',
          commentaires: commentaires,
        };
      }));

      const totalPages = Math.ceil(count / itemsPerPage);

      res.json({
        data: result,
        totalItems: count,
        totalPages: totalPages,
        currentPage: parseInt(page)
      });
    } catch (error) {
      console.error(error);
      res.status(500).json(error.message);
    }
  }
  
};

module.exports = presenceController;