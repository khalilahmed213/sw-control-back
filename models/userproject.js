module.exports = (sequelize, DataTypes) => {
    const UserProject = sequelize.define('UserProject', {
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id'
        }
      },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Project',
          key: 'id'
        }
      }
    });
  
    return UserProject;
  };