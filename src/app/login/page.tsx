'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { clearSession, setToken } from '@/lib/auth';

export default function LoginPage() {

  const router = useRouter();

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState('');

  async function login() {

    setError('');

    try {

      const response =
        await fetch(
          `${API_URL}/auth/login`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({

              username,
              password

            })
          }
        );

      if (!response.ok) {

        setError(
          'Invalid username or password'
        );

        return;
      }

      const data = await response.json();

      clearSession();
      setToken(data.token);

      router.push(
        '/profiles'
      );

    } catch (err) {

      console.error(err);

      setError(
        'Unable to login'
      );

    }
  }

  return (

    <main className="
      min-h-screen
      bg-[#050b18]
      text-white
      flex
      items-center
      justify-center
      px-6
    ">

      <div className="
        w-full
        max-w-md
        rounded-3xl
        border
        border-white/10
        bg-white/[0.04]
        p-10
        shadow-2xl
        shadow-blue-900/20
        backdrop-blur
      ">

        <div className="
          mb-6
          flex
          items-center
          gap-3
        ">

          <span className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-br
            from-blue-500
            to-blue-700
            text-xl
            font-bold
          ">
            B
          </span>

          <div>

            <h1 className="
              text-2xl
              font-bold
            ">
              BlueStreams
            </h1>

            <p className="
              text-sm
              text-zinc-400
            ">
              Sign in to your library
            </p>

          </div>

        </div>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
          className="
            w-full
            p-4
            mb-4
            rounded-xl
            bg-zinc-800
          "
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="
            w-full
            p-4
            mb-6
            rounded-xl
            bg-zinc-800
          "
        />

        <button
          onClick={login}
          className="
            w-full
            bg-blue-600 
            hover:bg-blue-500
            p-4
            rounded-xl
            font-semibold
          "
        >
          Login
        </button>

        {error && (

          <p className="
            text-red-400
            mt-4
          ">
            {error}
          </p>

        )}

      </div>

    </main>
  );
}