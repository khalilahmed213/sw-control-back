module.exports = (sequelize, DataTypes) => {
    const Presence = sequelize.define('Presence', {
      environnement: {
        type: DataTypes.STRING,
        allowNull: true
      },
      entree: {
        type: DataTypes.TIME,
        allowNull: true
      },
      sortie: {
        type: DataTypes.TIME,
        allowNull: true
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
        allowNull: true
      },
      prodMatin: {
        type: DataTypes.STRING,
        allowNull: true
      },
      prodApresMidi: {
        type: DataTypes.STRING,
        allowNull: true
      },
      commentaires: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    });
  
    Presence.associate = function(models) {
      // Define one-to-many relationship with Schedule
      Presence.belongsTo(models.Schedule, {
        foreignKey: {
          allowNull: true
        }
      });
      // Define many-to-one relationship with User
      Presence.belongsTo(models.User, {
        foreignKey: {
          allowNull: true
        }
      });
    };
  
    return Presence;
  };