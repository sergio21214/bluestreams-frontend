'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  useEffect(() => {

    const token =
      localStorage.getItem('token');

    if (!token) {

      router.push('/login');

      return;
    }

    loadProfiles();

  }, []);

  async function loadProfiles() {

    try {

      const token =
        localStorage.getItem('token');

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

  function selectProfile(
    profile: any
  ) {

    localStorage.setItem(
      'profileId',
      String(profile.id)
    );

    localStorage.setItem(
      'profileName',
      profile.profileName
    );

    router.push('/');
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
      bg-black
      min-h-screen
      text-white
      flex
      flex-col
      items-center
      justify-center
    ">

      <h1 className="
        text-5xl
        font-bold
        mb-12
      ">
        Who's Watching?
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