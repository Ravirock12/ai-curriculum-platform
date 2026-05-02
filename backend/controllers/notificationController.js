import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    let notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });

    // DEMO SEEDER: If the user has no notifications, auto-generate realistic ones
    if (notifications.length === 0) {
      const demoAlerts = [
        {
          user: req.user.id,
          type: 'critical',
          title: 'AI Dynamic Insight',
          message: '70% of students struggled with React Hooks this week. Consider scheduling a review session.',
          link: '/analytics'
        },
        {
          user: req.user.id,
          type: 'warning',
          title: 'Approval Required',
          message: 'Changes to approved curricula require admin approval before they are visible to students.',
          link: '/curriculum'
        },
        {
          user: req.user.id,
          type: 'info',
          title: 'System Update',
          message: 'SkillSync platform will undergo maintenance this weekend.',
          link: '/dashboard'
        }
      ];
      await Notification.insertMany(demoAlerts);
      notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    }

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving notifications' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error marking notification as read' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error marking all as read' });
  }
};

export const clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error clearing notifications' });
  }
};
