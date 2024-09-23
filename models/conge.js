module.exports = (sequelize, DataTypes) => {
  const Conge = sequelize.define('Conge', {
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    raison: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nbrDeJour: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  });

  Conge.associate = function(models) {
    Conge.belongsTo(models.User, { foreignKey: 'userId' });
    Conge.hasOne(models.Absence, {
      foreignKey: 'absenceableId',
      constraints: false,
      scope: {
        absenceable: 'Conge'
      }
    });
  };

  return Conge;
};