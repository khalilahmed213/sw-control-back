module.exports = (sequelize, DataTypes) => {
  const Autorisation = sequelize.define('Autorisation', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    heureDebut: {
      type: DataTypes.TIME,
      allowNull: false
    },
    heureFin: {
      type: DataTypes.TIME,
      allowNull: false
    },
    référence: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    nbrheures: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'en attente',
      validate: {
        isIn: [['en attente', 'accepté', 'rejeté']]
      }
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
    tableName: 'autorisations',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  });

  Autorisation.associate = function(models) {
    Autorisation.belongsTo(models.User, {
      foreignKey: 'UserId',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
    Autorisation.belongsTo(models.Schedule, {
      foreignKey: 'ScheduleId',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
  };

  return Autorisation;
};