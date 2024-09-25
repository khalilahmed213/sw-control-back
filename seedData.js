const { Sequelize, DataTypes } = require('sequelize');
const moment = require('moment');

// Initialize Sequelize with your database configuration
const sequelize = new Sequelize('swcontrole', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
});

const Absence = require('./models/absence')(sequelize, DataTypes);
const Autorisation = require('./models/autorisation')(sequelize, DataTypes);
const Conge = require('./models/conge')(sequelize, DataTypes);
const Presence = require('./models/presence')(sequelize, DataTypes);

// Tunisian holidays for 2024
const tunisianHolidays2024 = [
  '2024-01-01', '2024-03-20', '2024-04-09', '2024-04-10', 
  '2024-05-01', '2024-06-16', '2024-06-17', '2024-07-25', 
  '2024-12-17'
];

// Ramadan dates for 2024 (approximate)
const ramadanStart = moment('2024-03-11');
const ramadanEnd = moment('2024-04-08');

function getRandomTime(start, end) {
  const startTime = moment(start, 'HH:mm');
  const endTime = moment(end, 'HH:mm');
  const randomMinutes = Math.floor(Math.random() * endTime.diff(startTime, 'minutes'));
  return startTime.add(randomMinutes, 'minutes').format('HH:mm:ss');
}

function calculateProductionHours(entree, sortie, entree1, sortie1) {
  const morningHours = moment(sortie, 'HH:mm:ss').diff(moment(entree, 'HH:mm:ss'), 'hours', true);
  const afternoonHours = entree1 && sortie1 ? moment(sortie1, 'HH:mm:ss').diff(moment(entree1, 'HH:mm:ss'), 'hours', true) : 0;
  const totalHours = morningHours + afternoonHours;
  return {
    prod: totalHours.toFixed(2),
    prodMatin: morningHours.toFixed(2),
    prodApresMidi: afternoonHours.toFixed(2)
  };
}

async function insertData() {
  try {
    const startDate = moment('2024-01-01');
    const endDate = moment('2024-12-31');
    let totalDays = 0;
    let totalPresenceRecords = 0;

    for (let m = moment(startDate); m.diff(endDate, 'days') <= 0; m.add(1, 'days')) {
      const currentDate = m.format('YYYY-MM-DD');
      totalDays++;
      
      // Determine schedule ID based on date
      let scheduleId;
      if (m.isBetween('2024-06-01', '2024-09-30', null, '[]')) {
        scheduleId = 41; // Summer schedule
      } else if (m.isBetween(ramadanStart, ramadanEnd, null, '[]')) {
        scheduleId = 42; // Ramadan schedule
      } else {
        scheduleId = 34; // Regular schedule
      }

      const isHoliday = tunisianHolidays2024.includes(currentDate);
      const isWeekend = m.day() === 0 || m.day() === 6; // 0 is Sunday, 6 is Saturday

      for (const userId of [2, 3, 5]) {
        // Check for absence, autorisation, or conge
        const absenceExists = await Absence.findOne({
          where: {
            startDate: { [Sequelize.Op.lte]: currentDate },
            endDate: { [Sequelize.Op.gte]: currentDate },
            UserId: userId
          }
        });

        const autorisationExists = await Autorisation.findOne({
          where: {
            date: currentDate,
            userId: userId
          }
        });

        const congeExists = await Conge.findOne({
          where: {
            startDate: { [Sequelize.Op.lte]: currentDate },
            endDate: { [Sequelize.Op.gte]: currentDate },
            userId: userId
          }
        });

        if (absenceExists || autorisationExists || congeExists || isHoliday || isWeekend) {
          console.log(`Skipping presence for user ${userId} on ${currentDate} due to absence/holiday/weekend.`);
          continue;
        }

        // Insert Presence record
        let entree, sortie, entree1, sortie1;

        if (m.isBetween(ramadanStart, ramadanEnd, null, '[]')) {
          // Ramadan schedule
          entree = getRandomTime('08:00', '09:00');
          sortie = getRandomTime('15:00', '16:00');
          entree1 = null;
          sortie1 = null;
        } else {
          // Regular or summer schedule
          entree = getRandomTime('08:00', '09:00');
          sortie = getRandomTime('12:00', '13:00');
          entree1 = getRandomTime('14:00', '15:00');
          sortie1 = getRandomTime('17:00', '18:00');
        }

        const { prod, prodMatin, prodApresMidi } = calculateProductionHours(entree, sortie, entree1, sortie1);

        await Presence.create({
          environnement: 'Office',
          entree,
          sortie,
          entree1,
          sortie1,
          prod,
          prodMatin,
          prodApresMidi,
          commentaires: '',
          ScheduleId: scheduleId,
          UserId: userId
        });

        totalPresenceRecords++;
      }
    }

    // Insert some random Conge (leave) entries
    const congeEntries = [
      { startDate: '2024-02-01', endDate: '2024-02-05', userId: 2 },
      { startDate: '2024-04-15', endDate: '2024-04-19', userId: 3 },
      { startDate: '2024-08-05', endDate: '2024-08-16', userId: 5 }
    ];

    for (const entry of congeEntries) {
      await Conge.create({
        startDate: entry.startDate,
        endDate: entry.endDate,
        reference: `CONGE-${entry.userId}-${entry.startDate}`,
        raison: 'Annual Leave',
        nbrDeJour: moment(entry.endDate).diff(moment(entry.startDate), 'days') + 1,
        status: 'accepté',
        userId: entry.userId
      });
    }

    console.log(`Data insertion completed successfully.`);
    console.log(`Total days processed: ${totalDays}`);
    console.log(`Total presence records created: ${totalPresenceRecords}`);
  } catch (error) {
    console.error('Error inserting data:', error);
  } finally {
    await sequelize.close();
  }
}

insertData();