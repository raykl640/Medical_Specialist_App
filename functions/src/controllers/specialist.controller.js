const { Specialist, Appointment } = require('../config/database');

class SpecialistController {
  async getSpecialists(filters = {}) {
    try {
      let query = Specialist.find().populate('clinicId');
      
      if (filters.specialty) {
        query = query.where('specialty', filters.specialty);
      }
      if (filters.clinicId) {
        query = query.where('clinicId', filters.clinicId);
      }
      if (filters.languages) {
        query = query.where('languages').in(filters.languages);
      }

      const specialists = await query.exec();
      return { success: true, data: specialists };
    } catch (error) {
      throw error;
    }
  }

  async getSpecialistById(id) {
    try {
      const specialist = await Specialist.findById(id).populate('clinicId');
      if (!specialist) {
        throw new Error('Specialist not found');
      }
      return { success: true, data: specialist };
    } catch (error) {
      throw error;
    }
  }

  async addSpecialist(specialistData) {
    try {
      const specialist = new Specialist(specialistData);
      await specialist.save();
      return { success: true, data: specialist };
    } catch (error) {
      throw error;
    }
  }

  async updateSpecialist(id, specialistData) {
    try {
      const specialist = await Specialist.findByIdAndUpdate(
        id,
        { ...specialistData, updatedAt: new Date() },
        { new: true }
      ).populate('clinicId');

      if (!specialist) {
        throw new Error('Specialist not found');
      }

      return { success: true, data: specialist };
    } catch (error) {
      throw error;
    }
  }

  async updateAvailability(id, availability) {
    try {
      const specialist = await Specialist.findByIdAndUpdate(
        id,
        { 
          availability,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!specialist) {
        throw new Error('Specialist not found');
      }

      return { success: true, data: specialist };
    } catch (error) {
      throw error;
    }
  }

  async deleteSpecialist(id) {
    try {
      // Check for existing appointments
      const hasAppointments = await Appointment.exists({
        specialistId: id,
        status: 'confirmed',
        date: { $gte: new Date().toISOString().split('T')[0] }
      });

      if (hasAppointments) {
        throw new Error('Cannot delete specialist with upcoming appointments');
      }

      const specialist = await Specialist.findByIdAndDelete(id);
      if (!specialist) {
        throw new Error('Specialist not found');
      }

      return { success: true, message: 'Specialist deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  async getAvailabilityForDate(id, date) {
    try {
      const specialist = await Specialist.findById(id);
      if (!specialist) {
        throw new Error('Specialist not found');
      }

      // Get day of week from date
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      
      // Get specialist's schedule for that day
      const schedule = specialist.availability.find(
        slot => slot.day.toLowerCase() === dayOfWeek.toLowerCase()
      );

      if (!schedule) {
        return { success: true, data: { available: false, message: 'Not available on this day' } };
      }

      // Get existing appointments for that date
      const appointments = await Appointment.find({
        specialistId: id,
        date: date,
        status: 'confirmed'
      }).select('time');

      // Convert schedule to available time slots (30-minute intervals)
      const availableSlots = this._generateTimeSlots(
        schedule.startTime,
        schedule.endTime,
        appointments.map(apt => apt.time)
      );

      return {
        success: true,
        data: {
          available: true,
          schedule,
          availableSlots
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Helper method to generate available time slots
  _generateTimeSlots(startTime, endTime, bookedSlots) {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentTime = new Date();
    currentTime.setHours(startHour, startMinute, 0);
    
    const endDateTime = new Date();
    endDateTime.setHours(endHour, endMinute, 0);

    while (currentTime < endDateTime) {
      const timeString = currentTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });

      if (!bookedSlots.includes(timeString)) {
        slots.push(timeString);
      }

      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return slots;
  }
}

module.exports = new SpecialistController();
