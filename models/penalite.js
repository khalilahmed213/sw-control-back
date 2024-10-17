module.exports = (sequelize, DataTypes) => {
  const Penalite = sequelize.define('Penalite', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    raison: {
      type: DataTypes.STRING,
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    nbrDeJour: {
      type: DataTypes.INTEGER,
      allowNull: true
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
    tableName: 'penalites',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  });

  Penalite.associate = function(models) {
    Penalite.belongsTo(models.User, {
      foreignKey: 'UserId',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
    Penalite.belongsTo(models.Schedule, {
      foreignKey: 'ScheduleId',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
  };

  return Penalite;
};