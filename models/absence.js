module.exports = (sequelize, DataTypes) => {
  const Absence = sequelize.define('Absence', {
    raison: {
      type: DataTypes.STRING,
      allowNull: true
    },
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