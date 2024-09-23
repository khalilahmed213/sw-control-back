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
    },
    absenceable: {
      type: DataTypes.STRING,
      allowNull: false
    },
    absenceableId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  Absence.associate = function(models) {
    Absence.belongsTo(models.User, {
      foreignKey: 'absenceableId',
      constraints: false,
      as: 'user'
    });
    Absence.belongsTo(models.Autorisation, {
      foreignKey: 'absenceableId',
      constraints: false,
      as: 'autorisation'
    });
    Absence.belongsTo(models.Conge, {
      foreignKey: 'absenceableId',
      constraints: false,
      as: 'conge'
    });
  };

  return Absence;
};