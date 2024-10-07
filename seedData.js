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

// Tunisian holidays for 2024
const tunisianHolidays2024 = [
  '2024-01-01', '2024-03-20', '2024-04-09', '2024-04-10', 
  '2024-05-01', '2024-06-16', '2024-06-17', '2024-07-25', 
  '2024-12-17'
];
function getScheduleId(currentDate) {
  const m = moment(currentDate);

  if (m.isBetween('2024-06-01', '2024-09-30', null, '[]')) {
    return parseInt(2); // Summer schedule
  } else if (m.isBetween(ramadanStart, ramadanEnd, null, '[]')) {
    return parseInt(3); // Ramadan schedule
  } else {
    return parseInt(1); // Regular schedule
  }
}
// Ramadan dates for 2024 (approximate)
const ramadanStart = moment('2024-03-11');
const ramadanEnd = moment('2024-04-08');

function getRandomTime(start, end) {
  const startTime = moment(start, 'HH:mm');
  const endTime = moment(end, 'HH:mm');
  const randomMinutes = Math.floor(Math.random() * endTime.diff(startTime, 'minutes'));
  return startTime.add(randomMinutes, 'minutes').format('HH:mm:ss');
}
function getRandomMinutes() {
  return Math.floor(Math.random() * 8) + 1;
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
      const scheduleId = getScheduleId(currentDate);
      console.log(scheduleId);
      const isHoliday = tunisianHolidays2024.includes(currentDate);
      const isWeekend = m.day() === 0 || m.day() === 6;
      for(const userId of [2, 3]) {
        if (Math.random() < 0.05 && !isHoliday && !isWeekend) {  
          await Absence.create({
            raison: faker.lorem.word(), 
            UserId: userId,
            ScheduleId: scheduleId,
            date: currentDate,
          });
          console.log(`Created absence for user ${userId} on ${currentDate}`);
          continue;
        }

        if (Math.random() < 0.02 && !isHoliday && !isWeekend) {  // 2% chance of autorisation
          const heureDebut = getRandomTime('09:00', '14:00');
          const heureFin = moment(heureDebut, 'HH:mm:ss').add(2, 'hours').format('HH:mm:ss');
           await Autorisation.create({
            date: currentDate,
            heureDebut,
            heureFin,
            référence: `A-${userId}-${currentDate}`,
            nbrheures: '2',
            status: 'accepté',
            UserId: userId,
            ScheduleId:scheduleId
          }); 
          console.log(`Created autorisation for user ${userId} on ${currentDate}`);
        }

        // Check for existing absence, autorisation, or conge
        const absenceExists = await Absence.findOne({ where: { UserId: userId, Date: currentDate } }); // Added Date check
        const autorisationExists = await Autorisation.findOne({ where: { date: currentDate, userId: userId } });
        const congeExists = await Conge.findOne({
          where: {
            startDate: { [Sequelize.Op.lte]: currentDate },
            endDate: { [Sequelize.Op.gte]: currentDate },
            UserId: userId,
            ScheduleId:scheduleId
          }
        });

        if (absenceExists||autorisationExists || congeExists || isHoliday || isWeekend) {
          console.log(`Skipping presence for user ${userId} on ${currentDate} due to absence/holiday/weekend.`);
          continue;
        }

        // Insert Presence record
        let entree, sortie, entree1, sortie1;

        if (scheduleId===3) {
          // Ramadan schedule
          entree = getRandomTime('08:00', '8:30');
          sortie = getRandomTime('15:00', '15:30');
          entree1 = null;
          sortie1 = null;
        } else if(scheduleId===2) {
          entree = getRandomTime('08:00', '08:15');
          sortie = getRandomTime('12:00', '12:15');
          entree1 = getRandomTime('13:00', '13:15');
          sortie1 = getRandomTime('18:00', '18:15');
        }
        else{
          entree = getRandomTime('09:00', '09:15');
          sortie = getRandomTime('13:00', '13:15');
          entree1 = getRandomTime('14:00', '14:15');
          sortie1 = getRandomTime('18:00', '18:15');
        }

        const { prod, prodMatin, prodApresMidi } = calculateProductionHours(entree, sortie, entree1, sortie1);
        const retardm=getRandomMinutes()
        const  retardam=getRandomMinutes()
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
            ScheduleId:scheduleId,
            UserId: userId,
            date: currentDate ,
            retardm:retardm,
            retardam:retardam,
            retardtotal:retardm+ retardam
          }); 
        totalPresenceRecords++;
      }
    }
    const congeEntries = [
      { startDate: '2024-02-01', endDate: '2024-02-05', userId: 2 , ScheduleId:1},
      { startDate: '2024-04-15', endDate: '2024-04-19', userId: 3 , ScheduleId:1},
      { startDate: '2024-08-05', endDate: '2024-08-16', userId: 2, ScheduleId:1 },
      { startDate: '2024-07-01', endDate: '2024-07-12', userId: 3 , ScheduleId:1},
      { startDate: '2024-10-21', endDate: '2024-10-25', userId: 2, ScheduleId:1 },
      { startDate: '2024-12-23', endDate: '2024-12-31', userId: 3 , ScheduleId:1}
    ];

    for (const entry of congeEntries) {
       await Conge.create({
        startDate: entry.startDate,
        endDate: entry.endDate,
        reference: `CONGE-${entry.userId}-${entry.startDate}`,
        raison: 'Annual Leave',
        nbrDeJour: moment(entry.endDate).diff(moment(entry.startDate), 'days') + 1,
        status: 'accepté',
        UserId: entry.userId,
        ScheduleId:entry.ScheduleId
      }); 
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