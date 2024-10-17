const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('swcontrole', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

const Absence = require('./models/absence')(sequelize, DataTypes);




Absence.create({
    raison: "hey", 
    UserId: parseInt(2),   // Ensure UserId is an integer
    ScheduleId: parseInt(1),  // Ensure ScheduleId is an integer
    date: "2024-08-05",  // Ensure the date format is correct
  })
