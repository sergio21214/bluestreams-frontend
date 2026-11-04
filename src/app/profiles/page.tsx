'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  clearSession,
  getToken,
  setProfile
} from '@/lib/auth';
import { useSession } from '@/lib/useSession';

export default function ProfilesPage() {

  const router = useRouter();

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const [profiles, setProfiles] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const { role } = useSession();

  const admin = role === 'ADMIN';

  async function loadProfiles() {

    try {

      const token = getToken();

      const response =
        await fetch(
          `${API_URL}/profiles`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      console.log(
        'PROFILE STATUS',
        response.status
      );

      const text =
        await response.text();

      console.log(
        'PROFILE BODY',
        text
      );

      if (!response.ok) {

        setError(
          `Backend returned ${response.status}`
        );

        setLoading(false);

        return;
      }

      if (!text) {

        setProfiles([]);

        setLoading(false);

        return;
      }

      const data =
        JSON.parse(text);

      setProfiles(data);

      setLoading(false);

    } catch (err) {

      console.error(err);

      setError(
        'Unable to load profiles'
      );

      setLoading(false);
    }
  }

  useEffect(() => {

    if (!getToken()) {

      router.replace('/login');

      return;
    }

    loadProfiles();

  }, [router]);

  function selectProfile(
    profile: any
  ) {

    setProfile(
      profile.id,
      profile.profileName
    );

    router.push('/');
  }

  function logout() {

    clearSession();

    router.replace('/login');
  }

  if (loading) {

    return (

      <main className="
        bg-black
        text-white
        min-h-screen
        flex
        items-center
        justify-center
      ">

        <h1 className="text-2xl">
          Loading Profiles...
        </h1>

      </main>
    );
  }

  if (error) {

    return (

      <main className="
        bg-black
        text-white
        min-h-screen
        flex
        flex-col
        items-center
        justify-center
        gap-4
      ">

        <h1 className="
          text-red-500
          text-2xl
        ">
          Error
        </h1>

        <p>
          {error}
        </p>

      </main>
    );
  }

  return (

    <main className="
      relative
      bg-[#050b18]
      min-h-screen
      text-white
      flex
      flex-col
      items-center
      justify-center
      px-6
    ">

      <div className="
        absolute
        top-6
        right-6
        flex
        items-center
        gap-3
      ">

        {admin && (
          <a
            href="/admin"
            className="
              rounded-xl
              bg-white/5
              px-4
              py-2
              text-sm
              text-zinc-300
              transition
              hover:bg-white/10
              hover:text-white
            "
          >
            Admin
          </a>
        )}

        <button
          onClick={logout}
          className="
            rounded-xl
            bg-white/5
            px-4
            py-2
            text-sm
            text-zinc-300
            transition
            hover:bg-white/10
            hover:text-white
          "
        >
          Log out
        </button>

      </div>

      <div className="
        mb-3
        flex
        items-center
        gap-3
      ">
        <span className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          bg-gradient-to-br
          from-blue-500
          to-blue-700
          text-lg
          font-bold
        ">
          B
        </span>

        <span className="
          text-sm
          font-semibold
          uppercase
          tracking-[0.3em]
          text-blue-400
        ">
          BlueStreams
        </span>
      </div>

      <h1 className="
        text-5xl
        font-bold
        mb-12
      ">
        Who&apos;s Watching?
      </h1>

      <div className="
        flex
        gap-10
        flex-wrap
        justify-center
      ">

        {profiles.map((profile) => (

          <button
            key={profile.id}
            onClick={() =>
              selectProfile(profile)
            }
            className="
              flex
              flex-col
              items-center
              gap-4
              hover:scale-110
              transition
            "
          >

            <div className="
              w-40
              h-40
              rounded-xl
              bg-zinc-700
              flex
              items-center
              justify-center
              text-5xl
            ">
              👤
            </div>

            <span className="
              text-xl
            ">
              {profile.profileName}
            </span>

          </button>

        ))}

      </div>

    </main>
  );
}