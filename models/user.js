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
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
  });

  User.associate = function(models) {
    User.belongsToMany(models.Project, { through: 'UserProject', foreignKey: 'userId' });
    User.hasMany(models.Presence, { foreignKey: 'UserId', onDelete: 'CASCADE' });
    User.hasMany(models.Absence, { 
      foreignKey: 'absenceableId',
      constraints: false,
      scope: {
        absenceable: 'User'
      }
    });
    User.hasOne(models.UserInfo, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasMany(models.Autorisation, { foreignKey: 'userId' });
    User.hasMany(models.Conge, { foreignKey: 'userId' });
  };

  return User;
};