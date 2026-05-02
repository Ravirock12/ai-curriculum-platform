import RoleRequest from '../models/RoleRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// ── POST /api/role-requests ──────────────────────────────────
// Student submits a request to become a teacher
export const submitRoleRequest = async (req, res) => {
  try {
    const { requestedBranch, reason } = req.body;
    const userId = req.user._id;

    // Safety: only students can apply
    if (req.user.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Only students can request a role upgrade.'
      });
    }

    // Block if an active pending request already exists
    const existing = await RoleRequest.findOne({ userId, status: 'pending' });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending role request. Please wait for admin review.'
      });
    }

    if (!requestedBranch) {
      return res.status(400).json({ success: false, message: 'Requested Branch is required.' });
    }

    const request = await RoleRequest.create({
      userId,
      requestedRole: 'teacher',
      requestedBranch,
      reason: reason || ''
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    console.error('submitRoleRequest error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/role-requests/my ────────────────────────────────
// Student fetches their own request history
export const getMyRoleRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name email');

    res.json({ success: true, data: requests });
  } catch (err) {
    console.error('getMyRoleRequests error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/role-requests (Admin only) ─────────────────────
// Admin views all requests, optionally filtered by status
export const getAllRoleRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const requests = await RoleRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email branch role')
      .populate('reviewedBy', 'name email');

    res.json({ success: true, data: requests });
  } catch (err) {
    console.error('getAllRoleRequests error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PATCH /api/role-requests/:id/review (Admin only) ────────
// Admin approves or rejects a role request
export const reviewRoleRequest = async (req, res) => {
  try {
    const { status, adminNote, adminSelectedBranch } = req.body;
    const { id } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "approved" or "rejected".'
      });
    }

    if (status === 'approved' && !adminSelectedBranch) {
      return res.status(400).json({
        success: false,
        message: 'You must select a branch when approving a teacher request.'
      });
    }

    const request = await RoleRequest.findById(id).populate('userId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Role request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}.`
      });
    }

    // Update the role request
    request.status = status;
    request.adminNote = adminNote || '';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // If approved → promote user's role to teacher with admin-selected branch
    if (status === 'approved') {
      await User.findByIdAndUpdate(
        request.userId._id,
        { role: 'teacher', branch: adminSelectedBranch, status: 'active' },
        { new: true }
      );
      
      await Notification.create({
        user: request.userId._id,
        type: 'info',
        title: 'Role Upgrade Approved 🎉',
        message: `Congratulations! Your request to become a teacher has been approved. You are assigned to the ${adminSelectedBranch} branch.`,
        link: '/dashboard'
      });
    } else {
      await Notification.create({
        user: request.userId._id,
        type: 'warning',
        title: 'Role Upgrade Rejected',
        message: `Your request to become a teacher was rejected. ${adminNote ? 'Reason: ' + adminNote : ''}`,
        link: '/dashboard'
      });
    }

    res.json({
      success: true,
      message: `Request ${status} successfully.`,
      data: request
    });
  } catch (err) {
    console.error('reviewRoleRequest error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
