module.exports = (sequelize, DataTypes) => {
    const UserInfo = sequelize.define('UserInfo', {
      months: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      soldeAncienConge: {  // Added soldeAncienConge field
        type: DataTypes.INTEGER,
        allowNull: true
      },
    });
  
    UserInfo.associate = function(models) {
      UserInfo.belongsTo(models.User, { foreignKey: 'UserId', onDelete: 'CASCADE' }); // One-to-one relationship
    };
  
    return UserInfo;
  };