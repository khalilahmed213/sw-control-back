module.exports = (sequelize, DataTypes) => {
  const Conge = sequelize.define('Conge', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: false
    },
    raison: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nbrDeJour: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
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
    tableName: 'conges',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  });

  Conge.associate = function(models) {
    Conge.belongsTo(models.User, {
      foreignKey: 'UserId',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
    Conge.belongsTo(models.Schedule, {
      foreignKey: 'ScheduleId',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
  };

  return Conge;
};