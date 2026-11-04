'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { clearSession } from '@/lib/auth';
import { useSession } from '@/lib/useSession';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function icon(path: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d={path} />
    </svg>
  );
}

const PRIMARY_NAV: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: icon('M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z')
  },
  {
    href: '/search',
    label: 'Search',
    icon: icon('M21 21l-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z')
  },
  {
    href: '/music',
    label: 'Your Library',
    icon: icon('M4 19V5m0 14h16M8 19V9m4 10V5m4 14v-7')
  }
];

const COLLECTION_NAV: NavItem[] = [
  {
    href: '/music/recent',
    label: 'Recently Played',
    icon: icon('M12 8v5l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9z')
  },
  {
    href: '/music/repeat',
    label: 'On Repeat',
    icon: icon('M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3')
  },
  {
    href: '/music/top',
    label: 'Most Played',
    icon: icon('M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3z')
  }
];

const BROWSE_NAV: NavItem[] = [
  {
    href: '/movies',
    label: 'Movies',
    icon: icon('M3 5h18v14H3zM7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4')
  },
  {
    href: '/series',
    label: 'TV Shows',
    icon: icon('M3 6h18v12H3zM8 21h8M12 18v3')
  },
  {
    href: '/tv',
    label: 'Live TV',
    icon: icon('M3 7h18v12H3zM8 3l4 4 4-4')
  }
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active
}: {
  item: NavItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`
        flex
        items-center
        gap-3
        rounded-xl
        px-3
        py-2.5
        text-sm
        font-medium
        transition
        ${
          active
            ? 'bg-blue-500/15 text-white'
            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
        }
      `}
    >
      <span className={active ? 'text-blue-400' : ''}>
        {item.icon}
      </span>

      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export default function MusicShell({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const { profileName, role } = useSession();

  const admin = role === 'ADMIN';

  function logout() {
    clearSession();
    router.replace('/login');
  }

  const mobileNav = [
    ...PRIMARY_NAV,
    ...COLLECTION_NAV,
    ...BROWSE_NAV
  ];

  return (
    <div className="flex min-h-full bg-[#050b18] text-white">

      {/* DESKTOP SIDEBAR */}

      <aside
        className="
          sticky
          top-0
          hidden
          max-h-screen
          w-64
          shrink-0
          self-start
          flex-col
          gap-3
          overflow-y-auto
          border-r
          border-white/5
          bg-[#03070f]
          p-3
          lg:flex
        "
      >

        <Link
          href="/"
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            px-3
            py-3
            transition
            hover:bg-white/5
          "
        >
          <span
            className="
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
              shadow-lg
              shadow-blue-900/40
            "
          >
            B
          </span>

          <div>
            <p className="text-sm font-bold tracking-wide">
              BlueStreams
            </p>
            <p className="text-[11px] uppercase tracking-[0.25em] text-blue-400/80">
              Music
            </p>
          </div>
        </Link>

        <nav className="rounded-2xl bg-white/[0.03] p-2">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>

        <nav className="flex-1 rounded-2xl bg-white/[0.03] p-2">

          <p className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Your Collection
          </p>

          {COLLECTION_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}

          <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Browse
          </p>

          {BROWSE_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}

          {admin && (
            <NavLink
              item={{
                href: '/admin',
                label: 'Admin',
                icon: icon('M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z')
              }}
              active={isActive(pathname, '/admin')}
            />
          )}

        </nav>

        <div className="rounded-2xl bg-white/[0.03] p-3">

          <div className="flex items-center gap-3">

            <span
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-blue-500/20
                text-sm
                font-semibold
                text-blue-300
              "
            >
              {profileName.charAt(0).toUpperCase()}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {profileName}
              </p>

              <Link
                href="/profiles"
                className="text-xs text-zinc-400 hover:text-white"
              >
                Switch profile
              </Link>
            </div>

            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              className="
                rounded-lg
                p-2
                text-zinc-500
                transition
                hover:bg-white/10
                hover:text-white
              "
            >
              {icon('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9')}
            </button>

          </div>

        </div>

      </aside>

      {/* MAIN */}

      <div className="min-w-0 flex-1">

        {/* MOBILE HEADER */}

        <div
          className="
            sticky
            top-0
            z-30
            border-b
            border-white/10
            bg-[#050b18]/90
            px-4
            py-3
            backdrop-blur-xl
            lg:hidden
          "
        >

          <div className="flex items-center justify-between">

            <Link href="/" className="flex items-center gap-2">
              <span
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-gradient-to-br
                  from-blue-500
                  to-blue-700
                  text-sm
                  font-bold
                "
              >
                B
              </span>

              <span className="text-sm font-bold">
                BlueStreams
              </span>
            </Link>

            <Link
              href="/profiles"
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-blue-500/20
                text-xs
                font-semibold
                text-blue-300
              "
              aria-label="Switch profile"
            >
              {profileName.charAt(0).toUpperCase()}
            </Link>

          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">

            {mobileNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  shrink-0
                  rounded-full
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  transition
                  ${
                    isActive(pathname, item.href)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-zinc-400'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}

          </div>

        </div>

        {children}

      </div>

    </div>
  );
}
