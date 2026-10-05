'use client';

import { useEffect, useState } from 'react';
import { useRef } from 'react';

export default function AdminPage() {

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const [status, setStatus] =
    useState<any>();

  const [message, setMessage] =
    useState('');

  const [users, setUsers] =
    useState<any[]>([]);

  const [profiles, setProfiles] =
    useState<any[]>([]);

  const [newUsername, setNewUsername] =
    useState('');

  const [newEmail, setNewEmail] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [newRole, setNewRole] =
    useState('USER');
  
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [uploadMessage, setUploadMessage] =
    useState('');

  async function loadStatus() {

    const token =
      localStorage.getItem('token');

    const response =
      await fetch(
        `${API_URL}/admin/status`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const data =
      await response.json();

    setStatus(data);
  }

  async function loadUsers() {

    const token =
      localStorage.getItem('token');

    const response =
      await fetch(
        `${API_URL}/admin/users`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const data =
      await response.json();

    setUsers(data);
  }

  async function loadProfiles() {

    const token =
      localStorage.getItem('token');

    const response =
      await fetch(
        `${API_URL}/admin/profiles`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const data =
      await response.json();

    setProfiles(data);
  }

  async function runScan() {

    const token =
      localStorage.getItem('token');

    const response =
      await fetch(
        `${API_URL}/admin/scan`,
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const text =
      await response.text();

    setMessage(text);

    loadStatus();
  }

  async function createUser() {

    const token =
      localStorage.getItem('token');

    await fetch(
      `${API_URL}/admin/users`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({

          username:
            newUsername,

          email:
            newEmail,

          password:
            newPassword,

          role:
            newRole
        })
      }
    );

    setNewUsername('');
    setNewEmail('');
    setNewPassword('');

    loadUsers();
    loadProfiles();
    loadStatus();
  }

  async function deleteUser(
    id: number
  ) {

    const token =
      localStorage.getItem('token');

    await fetch(
      `${API_URL}/admin/users/${id}`,
      {
        method: 'DELETE',

        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    loadUsers();
    loadProfiles();
    loadStatus();
  }

  async function deleteProfile(
    id: number
  ) {

    const token =
      localStorage.getItem('token');

    await fetch(
      `${API_URL}/admin/profiles/${id}`,
      {
        method: 'DELETE',

        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    loadProfiles();
    loadStatus();
  }

  async function uploadPlaylist(
    event: React.ChangeEvent<HTMLInputElement>
  ) {

    const file =
      event.target.files?.[0];

    if (!file) return;

    const token =
      localStorage.getItem('token');

    const formData =
      new FormData();

    formData.append(
      'file',
      file
    );

    const content = await file.text();

     const response = await fetch(
        `${API_URL}/admin/iptv/import-file`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: file.name,
            content,
          }),
        }
      );


    if (response.ok) {

      setUploadMessage(
        'Playlist imported successfully.'
      );

    } else {

      setUploadMessage(
        'Import failed.'
      );

    }

  }

  useEffect(() => {

    loadStatus();

    loadUsers();

    loadProfiles();

  }, []);

  return (

    <main className="
      min-h-screen
      bg-slate-950
      text-white
      p-10
    ">

      <h1 className="
        text-5xl
        font-bold
        text-blue-400
        mb-10
      ">
        BlueStreams Admin
      </h1>

      {status && (

        <div className="
          grid
          md:grid-cols-3
          gap-6
          mb-10
        ">

          <div className="
            bg-slate-900
            rounded-2xl
            p-6
          ">

            <h2 className="text-slate-400">
              Media
            </h2>

            <p className="
              text-4xl
              font-bold
            ">
              {status.mediaCount}
            </p>

          </div>

          <div className="
            bg-slate-900
            rounded-2xl
            p-6
          ">

            <h2 className="text-slate-400">
              Users
            </h2>

            <p className="
              text-4xl
              font-bold
            ">
              {status.userCount}
            </p>

          </div>

          <div className="
            bg-slate-900
            rounded-2xl
            p-6
          ">

            <h2 className="text-slate-400">
              Profiles
            </h2>

            <p className="
              text-4xl
              font-bold
            ">
              {status.profileCount}
            </p>

          </div>

        </div>

      )}

      <div className="flex gap-4">

          <button
            onClick={runScan}
            className="
              bg-blue-600
              hover:bg-blue-500
              px-6
              py-3
              rounded-xl
              font-semibold
            "
          >
            Run Media Scan
          </button>

          <button
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="
              bg-green-600
              hover:bg-green-500
              px-6
              py-3
              rounded-xl
              font-semibold
            "
          >
            Import IPTV Playlist
          </button>

                <div className="
                  mt-6
                  bg-slate-900
                  rounded-2xl
                  p-6
                  flex
                  items-center
                  justify-between
                ">

                  <div>
                    <h2 className="
                      text-2xl
                      font-bold
                      text-blue-400
                    ">
                      Music
                    </h2>

                    <p className="
                      text-slate-400
                      mt-1
                    ">
                      Download and manage music from YouTube and YouTube Music.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      window.location.href = '/admin/music'
                    }
                    className="
                      bg-blue-600
                      hover:bg-blue-500
                      px-6
                      py-3
                      rounded-xl
                      font-semibold
                      transition
                    "
                  >
                    Music Downloader
                  </button>

                </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".m3u,.m3u8"
            hidden
            onChange={uploadPlaylist}
          />

      </div>

      {message && (

        <p className="
          text-green-400
          mt-4
        ">
          {message}
        </p>

      )}
      {uploadMessage && (

        <p className="
          text-green-400
          mt-2
        ">
          {uploadMessage}
        </p>

      )}

      <div className="
        mt-12
        bg-slate-900
        rounded-2xl
        p-6
      ">

        <h2 className="
          text-2xl
          font-bold
          text-blue-400
          mb-6
        ">
          Create User
        </h2>

        <div className="
          grid
          md:grid-cols-4
          gap-3
        ">

          <input
            value={newUsername}
            onChange={(e) =>
              setNewUsername(
                e.target.value
              )
            }
            placeholder="Username"
            className="
              bg-slate-800
              p-3
              rounded-xl
            "
          />

          <input
            value={newEmail}
            onChange={(e) =>
              setNewEmail(
                e.target.value
              )
            }
            placeholder="Email"
            className="
              bg-slate-800
              p-3
              rounded-xl
            "
          />

          <input
            value={newPassword}
            onChange={(e) =>
              setNewPassword(
                e.target.value
              )
            }
            placeholder="Password"
            className="
              bg-slate-800
              p-3
              rounded-xl
            "
          />

          <button
            onClick={createUser}
            className="
              bg-blue-600
              hover:bg-blue-500
              rounded-xl
            "
          >
            Create User
          </button>

        </div>

      </div>

      <div className="
        mt-12
        bg-slate-900
        rounded-2xl
        p-6
      ">

        <h2 className="
          text-2xl
          font-bold
          text-blue-400
          mb-6
        ">
          Users
        </h2>

        <table className="w-full">

          <thead>

            <tr className="text-left">

              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th></th>

            </tr>

          </thead>

          <tbody>

            {users.map(user => (

              <tr
                key={user.id}
                className="
                  border-t
                  border-slate-700
                "
              >

                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>

                <td>

                  <button
                    onClick={() =>
                      deleteUser(
                        user.id
                      )
                    }
                    className="
                      bg-red-600
                      hover:bg-red-500
                      px-3
                      py-1
                      rounded
                    "
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <div className="
        mt-12
        bg-slate-900
        rounded-2xl
        p-6
      ">

        <h2 className="
          text-2xl
          font-bold
          text-blue-400
          mb-6
        ">
          Profiles
        </h2>

        <table className="w-full">

          <thead>

            <tr className="text-left">

              <th>ID</th>
              <th>User ID</th>
              <th>Name</th>
              <th>Kids</th>
              <th></th>

            </tr>

          </thead>

          <tbody>

            {profiles.map(profile => (

              <tr
                key={profile.id}
                className="
                  border-t
                  border-slate-700
                "
              >

                <td>{profile.id}</td>

                <td>{profile.userId}</td>

                <td>{profile.profileName}</td>

                <td>
                  {profile.isKidsProfile
                    ? 'Yes'
                    : 'No'}
                </td>

                <td>

                  <button
                    onClick={() =>
                      deleteProfile(
                        profile.id
                      )
                    }
                    className="
                      bg-red-600
                      hover:bg-red-500
                      px-3
                      py-1
                      rounded
                    "
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}