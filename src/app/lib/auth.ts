// lib/auth.ts

export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null; // SSR guard

    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`));

    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

export function getToken(): string | null {
    const localToken = localStorage.getItem('token');
    if (localToken) return localToken;

    // Adjust "token" to whatever your backend actually names the cookie.
    return getCookie('token');
}

export function hasAnyCredential(): boolean {
    return getToken() !== null;
}