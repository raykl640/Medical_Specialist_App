const { User } = require('../config/database');

class UserController {
  async createUser(userData) {
    try {
      const user = new User(userData);
      await user.save();
      return { success: true, data: user };
    } catch (error) {
      throw error;
    }
  }

  async getUserProfile(uid) {
    try {
      const user = await User.findOne({ uid });
      if (!user) {
        throw new Error('User not found');
      }
      return { success: true, data: user };
    } catch (error) {
      throw error;
    }
  }

  async updateUserProfile(uid, userData) {
    try {
      const user = await User.findOneAndUpdate(
        { uid },
        { ...userData, updatedAt: new Date() },
        { new: true }
      );
      if (!user) {
        throw new Error('User not found');
      }
      return { success: true, data: user };
    } catch (error) {
      throw error;
    }
  }

  async addEmergencyContact(uid, contactData) {
    try {
      const user = await User.findOne({ uid });
      if (!user) {
        throw new Error('User not found');
      }

      user.emergencyContacts.push(contactData);
      await user.save();

      return { success: true, data: user };
    } catch (error) {
      throw error;
    }
  }

  async updateEmergencyContact(uid, contactId, contactData) {
    try {
      const user = await User.findOne({ uid });
      if (!user) {
        throw new Error('User not found');
      }

      const contactIndex = user.emergencyContacts.findIndex(
        contact => contact._id.toString() === contactId
      );

      if (contactIndex === -1) {
        throw new Error('Emergency contact not found');
      }

      user.emergencyContacts[contactIndex] = {
        ...user.emergencyContacts[contactIndex].toObject(),
        ...contactData
      };

      await user.save();
      return { success: true, data: user };
    } catch (error) {
      throw error;
    }
  }

  async deleteEmergencyContact(uid, contactId) {
    try {
      const user = await User.findOne({ uid });
      if (!user) {
        throw new Error('User not found');
      }

      user.emergencyContacts = user.emergencyContacts.filter(
        contact => contact._id.toString() !== contactId
      );

      await user.save();
      return { success: true, data: user };
    } catch (error) {
      throw error;
    }
  }

  async updateAllergies(uid, allergies) {
    try {
      const user = await User.findOneAndUpdate(
        { uid },
        { 
          knownAllergies: allergies,
          updatedAt: new Date()
        },
        { new: true }
      );
      if (!user) {
        throw new Error('User not found');
      }
      return { success: true, data: user };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserController();
