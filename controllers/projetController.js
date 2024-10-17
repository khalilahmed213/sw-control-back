const { Project, User, UserProject, Sequelize } = require('../models');
const Op = Sequelize.Op;

module.exports = {
  // Create a new project
  async createProject(req, res) {
    try {
      const { name, description, userIds } = req.body;

      // Create the project
      const project = await Project.create({
        name,
        description
      });

      // Associate users with the project
      if (userIds && userIds.length > 0) {
        await project.addUsers(userIds);
      }

      res.status(201).json({message:'project created successfully'});
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  },

  // Get all projects with associated users
  async getAllProjects(req, res) {
    try {
      const search = req.query.search || '';
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const sortBy = req.query.sortBy;
      const sortDesc = req.query.sortDesc === 'true';
console.log(sortDesc )
      // Ensure that page and limit are positive integers
      if (page < 1 || limit < 1) {
        return res.status(400).json({ message: 'Invalid pagination parameters' });
      }

      const offset = (page - 1) * limit;

      // Define search criteria
      const whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ]
      };

      // Define sorting order
      const orderClause = sortBy ? [[sortBy, sortDesc ? 'DESC' : 'ASC']] : [['name', 'ASC']];

      // Find and count projects based on the search criteria, pagination, and sorting
      const { count, rows } = await Project.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: orderClause,
        attributes: ['id', 'name', 'description'],
        include: [{
          model: User,
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }]
      });
      const totalPages = Math.ceil(count / limit);
      res.json({
        total: count,
        totalPages: totalPages,
        currentPage: page,
        itemsPerPage: limit,
        projects: rows
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
    }
  },

  // Get a single project by ID with associated users

  // Update a project and associate users
  async updateProject(req, res) {
    const { id } = req.params;
    const { name, description, userIds } = req.body;
  
    try {
      const project = await Project.findByPk(id);
  
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
  
      // Update project details
      project.name = name;
      project.description = description;
      await project.save();
  
      // Update the associations with users
      if (userIds && userIds.length > 0) {
        console.log('executing');
        await project.setUsers(userIds); // Use setUsers to update associations
        console.log('executed');
      } else {
        await project.setUsers([]); // Clear associations if no userIds are provided
      }
  
      // Fetch associated users to include in the response
  
      // Respond with the updated project and associated user details
      res.json({ message: 'Updated successfully'});
  
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  },
  async deleteProject(req, res) {
    const { id } = req.params;

    try {
      const project = await Project.findByPk(id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Remove all associations before deleting the project
      await project.setUsers([]);

      await project.destroy();

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }
};