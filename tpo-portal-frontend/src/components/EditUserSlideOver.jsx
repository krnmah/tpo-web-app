import { useState, useMemo, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { X } from './Icons';
import { ADMIN_UPDATE_USER, GET_STUDENTS, CATEGORY_ENUM, GENDER_ENUM } from '../graphql/queries';
import { BRANCHES, normalizeBranchName } from '../constants/branches';

const enrollmentRegex = /^\d{4}[A-Z]{4}\d{3}$/; // Format: 2022BCSE123

const validateEnrollment = (value) => {
  if (!value) return 'Enrollment number is required';
  if (!enrollmentRegex.test(value)) {
    return 'Invalid format (e.g., 2022BCSE123)';
  }
  return null;
};

export default function EditUserSlideOver({ isOpen, user, onClose, onSuccess, onError }) {
  const [editForm, setEditForm] = useState({
    name: '',
    enrollmentNumber: '',
    branch: '',
    category: '',
    gender: ''
  });
  const [formError, setFormError] = useState('');

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        enrollmentNumber: user.enrollmentNumber || '',
        branch: normalizeBranchName(user.branch),
        category: user.category || '',
        gender: user.gender || ''
      });
      setFormError('');
    }
  }, [user]);

  const [adminUpdateUser, { loading }] = useMutation(ADMIN_UPDATE_USER, {
    refetchQueries: [{ query: GET_STUDENTS }],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      // Call success callback first
      if (data?.adminUpdateUser) {
        onSuccess?.(data.adminUpdateUser);
      } else {
        // Fallback if response structure is different
        onSuccess?.(data);
      }
      // Clear errors and form
      setFormError('');
      setEditForm({
        name: '',
        enrollmentNumber: '',
        branch: '',
        category: '',
        gender: ''
      });
      // Close panel directly (bypass handleClose loading check)
      onClose();
    },
    onError: (error) => {
      setFormError(error.message);
      onError?.(error.message);
    }
  });

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      editForm.name !== user.name ||
      editForm.enrollmentNumber !== user.enrollmentNumber ||
      editForm.branch !== user.branch ||
      editForm.category !== user.category ||
      editForm.gender !== user.gender
    );
  }, [editForm, user]);

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!editForm.name.trim()) {
      setFormError('Name is required');
      return;
    }

    if (editForm.name.trim().length < 2) {
      setFormError('Name must be at least 2 characters');
      return;
    }

    const enrollmentError = validateEnrollment(editForm.enrollmentNumber);
    if (enrollmentError) {
      setFormError(enrollmentError);
      return;
    }

    // Filter out empty strings for enum fields (GraphQL enums don't accept "")
    const cleanInput = Object.entries(editForm).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    try {
      await adminUpdateUser({
        variables: {
          id: user.id,
          input: cleanInput
        }
      });
    } catch {
      // Handled by onError callback
    }
  };

  const handleClose = () => {
    if (loading) return;
    setEditForm({
      name: '',
      enrollmentNumber: '',
      branch: '',
      category: '',
      gender: ''
    });
    setFormError('');
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {formError}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              required
              disabled={loading}
            />
          </div>

          {/* Enrollment Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enrollment Number *
            </label>
            <input
              type="text"
              value={editForm.enrollmentNumber}
              onChange={(e) => handleInputChange('enrollmentNumber', e.target.value.toUpperCase())}
              placeholder="2022BCSE123"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Format: YYYYCCCC### (e.g., 2022BCSE123)</p>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              value={editForm.branch}
              onChange={(e) => handleInputChange('branch', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              disabled={loading}
            >
              <option value="">Select branch</option>
              {BRANCHES.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={editForm.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              disabled={loading}
            >
              <option value="">Select category</option>
              <option value={CATEGORY_ENUM.GENERAL}>GENERAL</option>
              <option value={CATEGORY_ENUM.SC}>SC</option>
              <option value={CATEGORY_ENUM.ST}>ST</option>
              <option value={CATEGORY_ENUM.OBC}>OBC</option>
              <option value={CATEGORY_ENUM.GEN_EWS}>GEN_EWS</option>
              <option value={CATEGORY_ENUM.PWD}>PWD</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={editForm.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              disabled={loading}
            >
              <option value="">Select gender</option>
              <option value={GENDER_ENUM.MALE}>Male</option>
              <option value={GENDER_ENUM.FEMALE}>Female</option>
              <option value={GENDER_ENUM.OTHER}>Other</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
