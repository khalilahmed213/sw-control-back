module.exports = (sequelize, DataTypes) => {
  const Absence = sequelize.define('Absence', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    raison: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION'
    },
    ScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Schedules',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION'
    }
  }, {
    tableName: 'absences',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  });

  Absence.associate = function(models) {
    Absence.belongsTo(models.User, {
      foreignKey: 'UserId',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
    Absence.belongsTo(models.Schedule, {
      foreignKey: 'ScheduleId',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
  };

  return Absence;
};