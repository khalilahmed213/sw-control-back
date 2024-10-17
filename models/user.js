module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
  
    phoneNumber: {  // Added phoneNumber field
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {  // Added address field
      type: DataTypes.STRING,
      allowNull: true
    },
  });

  User.associate = function(models) {
    // Define one-to-many relationship with Penalite
    User.hasMany(models.Penalite, {
      foreignKey: {
        allowNull: true
      }
    });
    User.belongsToMany(models.Project, { through: 'UserProject', foreignKey: 'UserId' });

    User.hasMany(models.Presence, { foreignKey: 'UserId', onDelete: 'CASCADE' });

    User.hasMany(models.Absence, { foreignKey: 'UserId', onDelete: 'CASCADE' });
    User.hasMany(models.Penalite, { foreignKey: 'UserId', onDelete: 'CASCADE' });
    User.hasOne(models.UserInfo, { foreignKey: 'UserId', onDelete: 'CASCADE' });
    User.hasMany(models.Autorisation, { foreignKey: 'UserId', onDelete: 'CASCADE' });
    User.hasMany(models.Conge, { foreignKey: 'UserId', onDelete: 'CASCADE' });

  };

  return User;
};