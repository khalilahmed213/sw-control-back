module.exports = (sequelize, DataTypes) => {
    const Absence = sequelize.define('Absence', {
      type: {
        type: DataTypes.STRING,
        allowNull: true
      },
      raison: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['en attente', 'accepté', 'rejeté']]
        }
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      référence: {
        type: DataTypes.STRING,
        allowNull: true
      }
    });
  
    Absence.associate = function(models) {
        // Define one-to-many relationship with Schedule
        Absence.belongsTo(models.Schedule, {
          foreignKey: {
            allowNull: true
          }
        });
        // Define many-to-one relationship with User
        Absence.belongsTo(models.User, {
          foreignKey: {
            allowNull: true
          }
        });
      };
  
    return Absence;
  };