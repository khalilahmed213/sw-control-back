const { Sequelize, DataTypes } = require('sequelize');
const moment = require('moment');
const { faker } = require('@faker-js/faker');

// Initialize Sequelize with your database configuration
const sequelize = new Sequelize('swcontrole', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

const Absence = require('./models/absence')(sequelize, DataTypes);
const Autorisation = require('./models/autorisation')(sequelize, DataTypes);
const Conge = require('./models/conge')(sequelize, DataTypes);
const Presence = require('./models/presence')(sequelize, DataTypes);
const Penalite = require('./models/penalite')(sequelize, DataTypes);

// Tunisian holidays for 2024
const tunisianHolidays2024 = [
  '2024-01-01', '2024-03-20', '2024-04-09', '2024-04-10', 
  '2024-05-01', '2024-06-16', '2024-06-17', '2024-07-25', 
  '2024-12-17'
];
function getRandomMinutes(min=5, max=10) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ramadan dates for 2024 (approximate)
const ramadanStart = moment('2024-03-11');
const ramadanEnd = moment('2024-04-08');

function getScheduleId(currentDate) {
  const m = moment(currentDate);

  if (m.isBetween('2024-06-01', '2024-08-31', null, '[]')) {
    return 2; // Summer schedule
  } else if (m.isBetween(ramadanStart, ramadanEnd, null, '[]')) {
    return 3; // Ramadan schedule
  } else {
    return 1; // Regular schedule
  }
}

function getRandomTime(start, end) {
  const startTime = moment(start, 'HH:mm');
  const endTime = moment(end, 'HH:mm');
  const randomMinutes = Math.floor(Math.random() * endTime.diff(startTime, 'minutes'));
  return startTime.add(randomMinutes, 'minutes').format('HH:mm:ss');
}

function calculateProductionHours(entree, sortie, entree1, sortie1, autorisationHours = 0) {
  const morningHours = moment(sortie, 'HH:mm:ss').diff(moment(entree, 'HH:mm:ss'), 'hours', true);
  const afternoonHours = entree1 && sortie1 ? moment(sortie1, 'HH:mm:ss').diff(moment(entree1, 'HH:mm:ss'), 'hours', true) : 0;
  const totalHours = morningHours + afternoonHours - autorisationHours;
  return {
    prod: totalHours.toFixed(2),
    prodMatin: (morningHours - (autorisationHours > morningHours ? morningHours : autorisationHours)).toFixed(2),
    prodApresMidi: (afternoonHours - (autorisationHours > morningHours ? autorisationHours - morningHours : 0)).toFixed(2)
  };
}

async function insertData() {
  try {
    const startDate = moment('2024-01-01');
    const endDate = moment('2024-12-31');
    let totalDays = 0;
    let totalPresenceRecords = 0;

    // Insert Conge entries first
    const congeEntries = [
      { startDate: '2024-02-01', endDate: '2024-02-05', UserId: 2, ScheduleId: 1 },
      { startDate: '2024-04-15', endDate: '2024-04-19', UserId: 3, ScheduleId: 1 },
      { startDate: '2024-07-01', endDate: '2024-07-12', UserId: 2, ScheduleId: 2 },
      { startDate: '2024-10-21', endDate: '2024-10-25', UserId: 3, ScheduleId: 1 },
    ];

    for (const entry of congeEntries) {
      await Conge.create({
        startDate: entry.startDate,
        endDate: entry.endDate,
        reference: `CONGE-${entry.UserId}-${entry.startDate}`,
        raison: 'Annual Leave',
        nbrDeJour: moment(entry.endDate).diff(moment(entry.startDate), 'days') + 1,
        status: 'accepté',
        UserId: entry.UserId,
        ScheduleId: entry.ScheduleId
      });
    }

    // Insert Penalite entries
    const penaliteEntries = [
      { startDate: '2024-03-01', endDate: '2024-03-03', UserId: 2, ScheduleId: 1, raison: 'Late arrivals' },
      { startDate: '2024-09-15', endDate: '2024-09-16', UserId: 3, ScheduleId: 1, raison: 'Unauthorized absence' },
    ];

    for (const entry of penaliteEntries) {
      await Penalite.create({
        startDate: entry.startDate,
        endDate: entry.endDate,
        raison: entry.raison,
        nbrDeJour: moment(entry.endDate).diff(moment(entry.startDate), 'days') + 1,
        UserId: entry.UserId,
        ScheduleId: entry.ScheduleId
      });
    }

    for (let m = moment(startDate); m.diff(endDate, 'days') <= 0; m.add(1, 'days')) {
      const currentDate = m.format('YYYY-MM-DD');
      totalDays++;

      // Determine schedule ID based on date
      const scheduleId = getScheduleId(currentDate);
      const isHoliday = tunisianHolidays2024.includes(currentDate);
      const isWeekend = m.day() === 0 || m.day() === 6;

      for (let UserId of [2,3]) {
        // Check for existing conge
        const congeExists = await Conge.findOne({
          where: {
            startDate: { [Sequelize.Op.lte]: currentDate },
            endDate: { [Sequelize.Op.gte]: currentDate },
            UserId: UserId
          }
        });

        if (congeExists) {
          console.log(`Skipping presence for user ${UserId} on ${currentDate} due to conge.`);
          continue;
        }

        if (Math.random() < 0.05 && !isHoliday && !isWeekend) {  
          await Absence.create({
            raison: faker.lorem.word(), 
            UserId: UserId,
            ScheduleId: scheduleId,
            date: currentDate,
          });
          console.log(`Created absence for user ${UserId} on ${currentDate}`);
          continue;
        }

        let autorisation = null;
        if (Math.random() < 0.02 && !isHoliday && !isWeekend) {
          const heureDebut = getRandomTime('09:00', '14:00');
          const heureFin = moment(heureDebut, 'HH:mm:ss').add(2, 'hours').format('HH:mm:ss');
          autorisation = await Autorisation.create({
            date: currentDate,
            heureDebut,
            heureFin,
            référence: `A-${UserId}-${currentDate}`,
            nbrheures: '2',
            status: 'accepté',
            UserId: UserId,
            ScheduleId: scheduleId
          }); 
          console.log(`Created autorisation for user ${UserId} on ${currentDate}`);
        }

        // Check for existing absence
        const absenceExists = await Absence.findOne({ where: { UserId: UserId, date: currentDate } });
        if (absenceExists || isHoliday || isWeekend) {
          console.log(`Skipping presence for user ${UserId} on ${currentDate} due to absence/holiday/weekend.`);
          continue;
        }

        // Insert Presence record
        let entree, sortie, entree1, sortie1;

        if (scheduleId === 3) { // Summer schedule
          entree =   entree = getRandomTime('08:00', '08:30');
          sortie = sortie = getRandomTime('12:00', '13:00');
          entree1 = getRandomTime('13:00', '13:10');
          sortie1 =  getRandomTime('16:30', '16:35');
        } else if (scheduleId === 2) { // Ramadan schedule
          entree = getRandomTime('08:00', '08:30');
          sortie = getRandomTime('15:00', '16:30');
          entree1 = null;
          sortie1 = null;
        } else { // Regular schedule
          entree = getRandomTime('08:00', '08:30');
          sortie = getRandomTime('13:00', '13:30');
          entree1 = getRandomTime('14:00', '13:15');
          sortie1 = getRandomTime('18:00', '18:30');
        }

        const autorisationHours = autorisation ? 2 : 0;
        const { prod, prodMatin, prodApresMidi } = calculateProductionHours(entree, sortie, entree1, sortie1, autorisationHours);
        let retardm = 0;
        let retardam = 0;
        if (scheduleId === 3) { // Summer schedule
          retardm = getRandomMinutes(5, 10);
          retardam = getRandomMinutes(5, 10);
        } else if (scheduleId === 2) { // Ramadan schedule
          retardm = getRandomMinutes(0, 10);
        } else { // Regular schedule
          retardm = getRandomMinutes(0, 10);
          retardam = getRandomMinutes(0, 10);
        }
        await Presence.create({
          environnement: "On Site",
          entree,
          sortie,
          entree1,
          sortie1,
          prod,
          prodMatin,
          prodApresMidi: prodApresMidi || null,
          commentaires: faker.lorem.sentence(),
          ScheduleId: scheduleId,
          UserId: UserId,
          date: currentDate,
          retardam:retardm,
          retardm:retardam,
          retardtotal:retardm+retardam
        }); 
        totalPresenceRecords++;
      }
    }

    console.log('Data insertion completed successfully.');
    console.log(`Total days processed: ${totalDays}`);
    console.log(`Total presence records created: ${totalPresenceRecords}`);
  } catch (error) {
    console.error('Error inserting data:', error);
  } finally {
    await sequelize.close();
  }
}

insertData();