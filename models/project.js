module.exports = (sequelize, DataTypes) => {
    const Project = sequelize.define('Project', {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    });
  
    Project.associate = function(models) {
      Project.belongsToMany(models.User, { through: 'UserProject', foreignKey: 'projectId' });
    };
  
    return Project;
  };