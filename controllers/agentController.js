const db = require('../models');
const bcrypt = require('bcrypt');
const Agent = db.User;
const { Op } = require('sequelize');

module.exports = {
  async getAgents(req, res) {
    try {
      const search = req.query.search || '';
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const sortBy = req.query.sortBy;
      const sortDesc = req.query.sortDesc === 'true';
      // Ensure that page and limit are positive integers
      if (page < 1 || limit < 1) {
        return res.status(400).json({ message: 'Invalid pagination parameters' });
      }

      const offset = (page - 1) * limit;

      // Define search criteria
      const whereClause = {
        role: 'employe',
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phoneNumber: { [Op.like]: `%${search}%` } },
          { address: { [Op.like]: `%${search}%` } }
        ]
      };

      // Define sorting order
      const orderClause = sortBy ? [[sortBy, sortDesc ? 'DESC' : 'ASC']] : [['name', 'ASC']];

      // Find and count agents based on the search criteria, pagination, and sorting
      const { count, rows } = await Agent.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: orderClause,
        attributes: ['id', 'name', 'email', 'months', 'phoneNumber', 'address']
      });

      // Calculate total pages
      const totalPages = Math.ceil(count / limit);

      // Send the agents and pagination data as a JSON response
      res.json({
        total: count,
        totalPages: totalPages,
        currentPage: page,
        itemsPerPage: limit,
        agents: rows
      });
    } catch (error) {
      console.error('Error fetching agents:', error);
      res.status(500).json({ message: 'Failed to fetch agents', error: error.message });
    }
  },

  async createAgent(req, res) {
    try {
      const { name, email, password, months, role, phoneNumber, address } = req.body;
  
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 12); // 12 is the salt rounds
  
      const agent = await Agent.create({
        name,
        email,
        password: hashedPassword,
        months,
        role,
        phoneNumber, // Added phoneNumber
        address // Added address
      });
  
      res.status(201).json(agent);
    } catch (error) {
      console.error('Error creating agent:', error);
      res.status(500).json({ message: 'Failed to create agent' });
    }
  },

  async updateAgent(req, res) {
    try {
      const { id } = req.params;
      const { name, email, password, months, phoneNumber, address } = req.body;
  
      const agent = await Agent.findByPk(id);
  
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }
  
      // If the password is being updated, hash it before saving
      const updatedFields = { name, email, months, phoneNumber, address };
      if (password) {
        updatedFields.password = await bcrypt.hash(password, 12);
      }
  
      await agent.update(updatedFields);
      res.json(agent);
    } catch (error) {
      console.error('Error updating agent:', error);
      res.status(500).json({ message: 'Failed to update agent' });
    }
  },

  async deleteAgent(req, res) {
    try {
      const { id } = req.params;
      const agent = await Agent.findByPk(id);
      
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }

      await agent.destroy();
      res.json({ message: 'Agent deleted successfully' });
    } catch (error) {
      console.error('Error deleting agent:', error);
      res.status(500).json({ message: 'Failed to delete agent' });
    }
  },

  async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const agent = await Agent.findByPk(id);

      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }

      // Implement reset password logic

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  },

  async getAllEmployees(req, res) {
    try {
      const employees = await Agent.findAll({
        where: { role: 'employe' },
        attributes: ['id', 'name']
      });

      res.json(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ message: 'Failed to fetch employees', error: error.message });
    }
  }
};