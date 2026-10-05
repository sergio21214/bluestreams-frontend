'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

      localStorage.setItem(
          "token",
          data.token
      );

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
      bg-black
      text-white
      flex
      items-center
      justify-center
    ">

      <div className="
        bg-zinc-900
        p-10
        rounded-2xl
        w-full
        max-w-md
      ">

        <h1 className="
          text-4xl
          font-bold
          mb-8
          text-blue-600
        ">
          BlueStreams
        </h1>

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