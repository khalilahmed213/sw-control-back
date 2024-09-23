module.exports = (sequelize, DataTypes) => {
  const Autorisation = sequelize.define('Autorisation', {
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    heureDebut: {
      type: DataTypes.TIME,
      allowNull: true
    },
    heureFin: {
      type: DataTypes.TIME,
      allowNull: true
    },
    référence: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    nbrheures: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'en attente',
      validate: {
        isIn: [['en attente', 'accepté', 'rejeté']]
      }
    }
  });

  Autorisation.associate = function(models) {
    Autorisation.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false
      }
    });
    Autorisation.hasOne(models.Absence, {
      foreignKey: 'absenceableId',
      constraints: false,
      scope: {
        absenceable: 'Autorisation'
      }
    });
  };

  return Autorisation;
};