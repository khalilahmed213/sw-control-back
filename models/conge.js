module.exports = (sequelize, DataTypes) => {
  const Conge = sequelize.define('Conge', {
    startDate: {  // Added startDate field
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {  // Added endDate field
      type: DataTypes.DATE,
      allowNull: true
    },
    reference: {  // Added reference field
      type: DataTypes.STRING,
      allowNull: true
    },
    raison: {  // Added reference field
      type: DataTypes.STRING,
      allowNull: true
    },
    nbrDeJour: {  // Added nbrDeJour field
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {  // Added status field
      type: DataTypes.STRING,
      allowNull: true
    },
    userId: {  // Foreign key to User
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',  // Ensure this matches the User model name
        key: 'id'
      }
    }
  });

  Conge.associate = function(models) {
    Conge.belongsTo(models.User, { foreignKey: 'userId' });  // Association with User
  };

  return Conge;
};