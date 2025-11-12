import { useState } from 'react';
import { User } from '@/models/User';
import { useToast } from '@/components/ui/Toast';

interface UserFormProps {
  user?: (User & { _id: string }) | null;
  onClose: () => void;
}

export default function UserForm({ user, onClose }: UserFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'staff'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = user?._id 
        ? `/api/users/${user._id}`
        : '/api/users';

      const method = user?._id ? 'PUT' : 'POST';

      // Don't send password if it's empty during edit
      const payload = {
        ...formData,
        ...((!user?._id || formData.password) && { password: formData.password })
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save user');
      }

      showToast(
        user?._id 
          ? 'User updated successfully'
          : 'User created successfully',
        'success'
      );
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to save user',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
          placeholder="Enter name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
          placeholder="Enter email"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password {user?._id && '(leave blank to keep current)'}
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required={!user?._id}
          minLength={6}
          className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
          placeholder={user?._id ? 'Leave blank to keep current' : 'Enter password'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
        >
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (user?._id ? 'Updating...' : 'Creating...') 
            : (user?._id ? 'Update User' : 'Create User')
          }
        </button>
      </div>
    </form>
  );
} 