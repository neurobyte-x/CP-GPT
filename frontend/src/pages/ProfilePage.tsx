/**
 * User profile page — settings, CF handle linking, account management.
 * Dark theme styled, no Layout.tsx dependencies.
 */

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSyncCF } from '@/hooks/useApi';
import { User, RefreshCw, Link2, Save, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function ratingColor(r: number | null) {
  if (r === null) return 'text-muted-foreground';
  if (r < 1200) return 'text-gray-400';
  if (r < 1400) return 'text-green-400';
  if (r < 1600) return 'text-cyan-400';
  if (r < 1900) return 'text-blue-400';
  if (r < 2100) return 'text-purple-400';
  return 'text-red-400';
}

export default function ProfilePage() {
  const { user, updateUser, isLoading } = useAuthStore();
  const syncCF = useSyncCF();

  const [username, setUsername] = useState(user?.username ?? '');
  const [cfHandle, setCfHandle] = useState(user?.cf_handle ?? '');
  const [estimatedRating, setEstimatedRating] = useState(user?.estimated_rating ?? 800);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
    <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and Codeforces integration
        </p>
      </div>

      {/* Account Info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{user.username}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
        </div>
      </div>

      {/* Codeforces Integration */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="mb-5 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-neon-cyan" />
          <h2 className="text-base font-semibold">Codeforces Integration</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">CF Handle</label>
            <input
              type="text"
              value={cfHandle}
              onChange={(e) => setCfHandle(e.target.value)}
              placeholder="e.g., tourist"
              className="w-full rounded-lg border border-border bg-secondary/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Manual Rating Estimate
            </label>
            <input
              type="number"
              value={estimatedRating}
              onChange={(e) => setEstimatedRating(Number(e.target.value))}
              min={800}
              max={3500}
              step={100}
              className="w-full rounded-lg border border-border bg-secondary/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Used when CF data isn't available. Overwritten on sync.
            </p>
          </div>

          {user.cf_handle && (
            <div className="rounded-lg bg-secondary/40 border border-border/50 p-4">
              <h4 className="text-sm font-medium mb-2">Synced Data</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Rating:</span>{' '}
                  <span className={`font-bold ${ratingColor(user.estimated_rating)}`}>
                    {user.estimated_rating ?? 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Rating:</span>{' '}
                  <span className="font-bold text-foreground">
                    {user.cf_max_rating ?? 'N/A'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSync}
                disabled={syncCF.isPending}
                className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${syncCF.isPending ? 'animate-spin' : ''}`} />
                {syncCF.isPending ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Security */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-neon-purple" />
          <h2 className="text-base font-semibold">Account</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Member since {new Date(user.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
