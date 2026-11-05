'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  adminJson,
  adminText,
  type AdminProfile,
  type AdminUser
} from '@/lib/admin';

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  SectionTitle,
  Spinner,
  TextInput
} from './ui';

export default function ProfilesSection() {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(
    null
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [profileData, userData] = await Promise.all([
        adminJson<AdminProfile[]>('/admin/profiles'),
        adminJson<AdminUser[]>('/admin/users')
      ]);

      setProfiles(profileData);
      setUsers(userData);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load profiles'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteProfile(profile: AdminProfile) {
    if (
      !window.confirm(
        `Delete profile "${profile.profileName}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(profile.id);
    setMessage('');
    setError('');

    try {
      await adminText(`/admin/profiles/${profile.id}`, {
        method: 'DELETE'
      });

      setMessage(`Profile "${profile.profileName}" deleted.`);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not delete profile'
      );
    } finally {
      setDeletingId(null);
    }
  }

  const userById = new Map(
    users.map((user) => [user.id, user])
  );

  const term = search.trim().toLowerCase();

  const filtered = term
    ? profiles.filter((profile) => {
        const user = userById.get(profile.userId);

        return (
          profile.profileName.toLowerCase().includes(term) ||
          (user?.username ?? '').toLowerCase().includes(term)
        );
      })
    : profiles;

  return (
    <div className="space-y-6">

      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <Card>

        <SectionTitle
          title="Profiles"
          subtitle={`${profiles.length} profile${
            profiles.length === 1 ? '' : 's'
          } · New users automatically receive one default profile.`}
          action={
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search profiles..."
              className="w-60"
            />
          }
        />

        {loading ? (
          <Spinner label="Loading profiles..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No profiles found"
            description="Profiles are created when a user signs up or when an admin creates a user."
          />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[680px] text-left text-sm">

              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="pb-3 font-semibold">Profile</th>
                  <th className="pb-3 font-semibold">Owner</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">

                {filtered.map((profile) => {
                  const owner = userById.get(profile.userId);

                  return (
                    <tr key={profile.id} className="align-middle">

                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-300">
                            {profile.profileName
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                          <p className="font-semibold text-white">
                            {profile.profileName}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 pr-4 text-zinc-300">
                        {owner?.username || `User ${profile.userId}`}
                      </td>

                      <td className="py-3 pr-4">
                        <Badge
                          tone={
                            profile.isKidsProfile ? 'amber' : 'slate'
                          }
                        >
                          {profile.isKidsProfile ? 'Kids' : 'Standard'}
                        </Badge>
                      </td>

                      <td className="py-3 pr-4 text-zinc-500">
                        {profile.id}
                      </td>

                      <td className="py-3 text-right">
                        <Button
                          variant="danger"
                          disabled={deletingId === profile.id}
                          onClick={() => deleteProfile(profile)}
                        >
                          {deletingId === profile.id
                            ? 'Deleting...'
                            : 'Delete'}
                        </Button>
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </Card>

    </div>
  );
}
