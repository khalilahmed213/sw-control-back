module.exports = (sequelize, DataTypes) => {
  const Presence = sequelize.define('Presence', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    environnement: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entree: {
      type: DataTypes.TIME,
      allowNull: false
    },
    sortie: {
      type: DataTypes.TIME,
      allowNull: false
    },
    entree1: {
      type: DataTypes.TIME,
      allowNull: true
    },
    sortie1: {
      type: DataTypes.TIME,
      allowNull: true
    },
    prod: {
      type: DataTypes.STRING,
      allowNull: false
    },
    prodMatin: {
      type: DataTypes.STRING,
      allowNull: false
    },
    prodApresMidi: {
      type: DataTypes.STRING,
      allowNull: true
    },
    retardm: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    retardam: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    retardtotal: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    commentaires: {
      type: DataTypes.TEXT,
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
    tableName: 'presences',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  });

  Presence.associate = function(models) {
    Presence.belongsTo(models.User, {
      foreignKey: 'UserId',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
    Presence.belongsTo(models.Schedule, {
      foreignKey: 'ScheduleId',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
  };

  return Presence;
};