const db = require('../models');
const bcrypt = require('bcrypt');
const Agent = db.User;
const UserInfo=db.UserInfo
const { Op } = require('sequelize');

module.exports = {
  async getAgents(req, res) {
    try {
      const search = req.query.search || '';
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const sortBy = req.query.sortBy;
      const sortDesc = req.query.sortDesc === 'true';
  
      if (page < 1 || limit < 1) {
        return res.status(400).json({ message: 'Invalid pagination parameters' });
      }
  
      const offset = (page - 1) * limit;
  
      const whereClause = {
        role: 'employe',
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phoneNumber: { [Op.like]: `%${search}%` } },
          { address: { [Op.like]: `%${search}%` } }
        ]
      };
  
      let orderClause;
      if (sortBy === 'UserInfo.months') {
        orderClause = [[db.UserInfo, 'months', sortDesc ? 'DESC' : 'ASC']];
      } else if (sortBy) {
        orderClause = [[sortBy, sortDesc ? 'DESC' : 'ASC']];
      } else {
        orderClause = [['name', 'ASC']];
      }
  
      const { count, rows } = await Agent.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: orderClause,
        attributes: ['id', 'name', 'email', 'phoneNumber', 'address'],
        include: [{
          model: db.UserInfo,
          attributes: ['months']
        }]
      });
  
      const totalPages = Math.ceil(count / limit);
  
      res.json({
        total: count,
        totalPages: totalPages,
        currentPage: page,
        itemsPerPage: limit,
        agents: rows
      });
    } catch (error) {
      console.error('Error fetching agents:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async createAgent(req, res) {
    try {
      const { name, email, password, months, role, phoneNumber, address } = req.body;
  
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 12);
  
      const agent = await Agent.create({
        name,
        email,
        password: hashedPassword,
        role,
        phoneNumber, // Added phoneNumber
        address // Added address
      });
      await UserInfo.create({ UserId:agent.id, months });
      res.status(201).json(agent);
    } catch (error) {
      console.error('Error creating agent:', error);
      res.status(500).json({ message:error.message });
    }
  },

  async updateAgent(req, res) {
    try {
      const { id } = req.params;
      const { name, email, months, phoneNumber, address } = req.body;
  
      const user = await Agent.findByPk(id, {
        include: [{ model: UserInfo }]
      });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Update User fields
      const updatedFields = { name, email, phoneNumber, address };
  
      await user.update(updatedFields);
  
      // Update or create UserInfo
      if (user.UserInfo) {
        await user.UserInfo.update({ months });
      }
  
      res.json({message:"mis à jour avec succé"});
    } catch (error) {
      res.status(500).json({ message:error.message });
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