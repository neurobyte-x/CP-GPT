/**
 * User profile page — settings, CF handle linking, account management.
 */

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSyncCF } from '@/hooks/useApi';
import { Card, Spinner } from '@/components/Layout';
import { User, RefreshCw, Link2, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { getRatingBadgeColor } from '@/types';

export default function ProfilePage() {
  const { user, updateUser, isLoading } = useAuthStore();
  const syncCF = useSyncCF();

  const [username, setUsername] = useState(user?.username ?? '');
  const [cfHandle, setCfHandle] = useState(user?.cf_handle ?? '');
  const [estimatedRating, setEstimatedRating] = useState(user?.estimated_rating ?? 800);

  if (!user) return <Spinner size="lg" />;

  const handleSave = async () => {
    try {
      await updateUser({
        username: username !== user.username ? username : undefined,
        cf_handle: cfHandle !== user.cf_handle ? cfHandle : undefined,
        estimated_rating: estimatedRating !== user.estimated_rating ? estimatedRating : undefined,
      } as Partial<typeof user>);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleSync = async () => {
    if (!user.cf_handle) {
      toast.error('Link your Codeforces handle first');
      return;
    }
    try {
      await syncCF.mutateAsync();
      toast.success('Codeforces data synced');
    } catch {
      toast.error('Sync failed');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500">Manage your account and Codeforces integration</p>
      </div>

      {/* Account Info */}
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <User className="h-6 w-6 text-brand-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user.username}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
          </div>
        </div>
      </Card>

      {/* Codeforces Integration */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Codeforces Integration</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">CF Handle</label>
            <input
              type="text"
              value={cfHandle}
              onChange={(e) => setCfHandle(e.target.value)}
              placeholder="e.g., tourist"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Manual Rating Estimate
            </label>
            <input
              type="number"
              value={estimatedRating}
              onChange={(e) => setEstimatedRating(Number(e.target.value))}
              min={800}
              max={3500}
              step={100}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Used when CF data isn't available. Overwritten on sync.
            </p>
          </div>

          {user.cf_handle && (
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="text-sm font-medium text-gray-700">Synced Data</h4>
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Current Rating:</span>{' '}
                  <span className={clsx('font-medium', getRatingBadgeColor(user.estimated_rating).split(' ')[1])}>
                    {user.estimated_rating ?? 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Max Rating:</span>{' '}
                  <span className="font-medium text-gray-700">
                    {user.cf_max_rating ?? 'N/A'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSync}
                disabled={syncCF.isPending}
                className="mt-3 flex items-center gap-2 rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                <RefreshCw className={clsx('h-4 w-4', syncCF.isPending && 'animate-spin')} />
                {syncCF.isPending ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Account Security */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Account</h2>
        </div>
        <p className="text-sm text-gray-500">
          Member since {new Date(user.created_at).toLocaleDateString()}
        </p>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
