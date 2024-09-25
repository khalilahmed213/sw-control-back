module.exports = (sequelize, DataTypes) => {
    const Penalite = sequelize.define('Penalite', {
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
      nbrDeJour: {  // Added nbrDeJour field
        type: DataTypes.INTEGER,
        allowNull: true
      },
    });
  
    Penalite.associate = function(models) {
        // Define one-to-many relationship with Schedule
        Penalite.belongsTo(models.Schedule, {
          foreignKey: {
            allowNull: true
          }
        });
        // Define many-to-one relationship with User
        Penalite.belongsTo(models.User, {
          foreignKey: {
            allowNull: true
          }
        });
      };
  
    return Penalite;
  }; 