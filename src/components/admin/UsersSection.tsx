'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  adminJson,
  adminText,
  type AdminProfile,
  type AdminTab,
  type AdminUser
} from '@/lib/admin';

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  SectionTitle,
  Select,
  Spinner,
  TextInput
} from './ui';

type CreateForm = {
  username: string;
  email: string;
  password: string;
  role: string;
};

const EMPTY_FORM: CreateForm = {
  username: '',
  email: '',
  password: '',
  role: 'USER'
};

export default function UsersSection({
  onNavigate
}: {
  onNavigate: (tab: AdminTab) => void;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(
    null
  );

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [userData, profileData] = await Promise.all([
        adminJson<AdminUser[]>('/admin/users'),
        adminJson<AdminProfile[]>('/admin/profiles')
      ]);

      setUsers(userData);
      setProfiles(profileData);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load users'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser() {
    if (!form.username.trim() || !form.password.trim()) {
      setError('Username and password are required.');
      return;
    }

    setCreating(true);
    setMessage('');
    setError('');

    try {
      await adminJson<AdminUser>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim() || null,
          password: form.password,
          role: form.role
        })
      });

      setForm(EMPTY_FORM);
      setMessage(
        'User created. The password was hashed and a default profile was added automatically.'
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create user'
      );
    } finally {
      setCreating(false);
    }
  }

  async function deleteUser(user: AdminUser) {
    if (
      !window.confirm(
        `Delete "${user.username}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(user.id);
    setMessage('');
    setError('');

    try {
      await adminText(`/admin/users/${user.id}`, {
        method: 'DELETE'
      });

      setMessage(`User "${user.username}" deleted.`);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete user'
      );
    } finally {
      setDeletingId(null);
    }
  }

  const term = search.trim().toLowerCase();

  const filtered = term
    ? users.filter(
        (user) =>
          user.username.toLowerCase().includes(term) ||
          (user.email ?? '').toLowerCase().includes(term)
      )
    : users;

  const profileCount = (userId: number) =>
    profiles.filter((profile) => profile.userId === userId).length;

  return (
    <div className="space-y-6">

      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <Card>
        <SectionTitle
          title="Create user"
          subtitle="Passwords are hashed by the server and every new user gets a default profile."
        />

        <div className="grid gap-4 md:grid-cols-4">

          <Field label="Username">
            <TextInput
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  username: event.target.value
                }))
              }
              placeholder="jdoe"
            />
          </Field>

          <Field label="Email" hint="Optional">
            <TextInput
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value
                }))
              }
              placeholder="jdoe@example.com"
            />
          </Field>

          <Field label="Password">
            <TextInput
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value
                }))
              }
              placeholder="••••••••"
            />
          </Field>

          <Field label="Role">
            <Select
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value
                }))
              }
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>

        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={createUser}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create user'}
          </Button>
        </div>

      </Card>

      <Card>
        <SectionTitle
          title="Users"
          subtitle={`${users.length} account${
            users.length === 1 ? '' : 's'
          }`}
          action={
            <div className="flex items-center gap-2">
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="w-56"
              />
              <Button variant="ghost" onClick={() => onNavigate('profiles')}>
                Profiles
              </Button>
            </div>
          }
        />

        {loading ? (
          <Spinner label="Loading users..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Create a user above or adjust your search."
          />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[760px] text-left text-sm">

              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Profiles</th>
                  <th className="pb-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">

                {filtered.map((user) => (
                  <tr key={user.id} className="align-middle">

                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-300">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-white">
                            {user.username}
                          </p>
                          <p className="text-xs text-zinc-500">
                            ID {user.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 pr-4 text-zinc-300">
                      {user.email || '—'}
                    </td>

                    <td className="py-3 pr-4">
                      <Badge
                        tone={
                          user.role === 'ADMIN' ? 'blue' : 'slate'
                        }
                      >
                        {user.role || 'USER'}
                      </Badge>
                    </td>

                    <td className="py-3 pr-4">
                      <Badge
                        tone={user.enabled === false ? 'red' : 'green'}
                      >
                        {user.enabled === false ? 'Disabled' : 'Enabled'}
                      </Badge>
                    </td>

                    <td className="py-3 pr-4 text-zinc-300">
                      {profileCount(user.id)}
                    </td>

                    <td className="py-3 text-right">
                      <Button
                        variant="danger"
                        disabled={deletingId === user.id}
                        onClick={() => deleteUser(user)}
                      >
                        {deletingId === user.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </Button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </Card>

    </div>
  );
}
