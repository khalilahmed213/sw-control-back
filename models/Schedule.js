module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define('Schedule', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    morningStart: {
      type: DataTypes.TIME,
      allowNull: true
    },
    morningEnd: {
      type: DataTypes.TIME,
      allowNull: true
    },
    breakStart: {
      type: DataTypes.TIME,
      allowNull: true
    },
    breakEnd: {
      type: DataTypes.TIME,
      allowNull: true
    },
    afternoonStart: {
      type: DataTypes.TIME,
      allowNull: true
    },
    afternoonEnd: {
      type: DataTypes.TIME,
      allowNull: true
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isSelected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  });

  Schedule.associate = function(models) {
    Schedule.hasOne(models.Presence, {
      foreignKey: {
        name:'ScheduleId',
        allowNull: false
      }
    });
    Schedule.hasOne(models.Absence, {
      foreignKey: {
        name: 'ScheduleId',
        allowNull: true
      }
    });
    Schedule.hasOne(models.Penalite, {
      foreignKey: {
        name: 'ScheduleId',
        allowNull: true
      } });
      Schedule.hasOne(models.Conge, {
        foreignKey: {
          name: 'ScheduleId',
          allowNull: true
        } });
        Schedule.hasOne(models.Autorisation, {
          foreignKey: {
            name: 'ScheduleId',
            allowNull: true
          } });
      
    
  };

  return Schedule;
};