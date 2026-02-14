const Notification = require('../models/Notification');

// Create notification
exports.createNotification = async (userId, type, message, relatedId = null, relatedModel = null) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
      relatedId,
      relatedModel
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Notification types helper
exports.NOTIFICATION_TYPES = {
  NEW_APPLICATION: 'application',
  INTERVIEW_INVITE: 'interview_invite',
  INTERVIEW_COMPLETE: 'interview_complete',
  STATUS_UPDATE: 'status_update',
  NEW_MESSAGE: 'message'
};
