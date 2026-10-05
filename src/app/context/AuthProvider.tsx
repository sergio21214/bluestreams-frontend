'use client';

import { useEffect } from 'react';

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {

    useEffect(() => {

        const originalFetch = window.fetch;

        window.fetch = async (
            input: RequestInfo | URL,
            init?: RequestInit
        ) => {

            const token =
                localStorage.getItem("token");

            const headers =
                new Headers(init?.headers);

            const url =
                typeof input === "string"
                    ? input
                    : input instanceof URL
                        ? input.toString()
                        : input.url;

            const isApi =
                url.startsWith(process.env.NEXT_PUBLIC_API_URL!);

            const isMedia =
                url.startsWith(process.env.NEXT_PUBLIC_MEDIA_URL!);

            if (token && isApi && !isMedia) {

                const url =
                    typeof input === "string"
                        ? input
                        : input.toString();

                if (
                    token &&
                    url.startsWith(process.env.NEXT_PUBLIC_API_URL!)
                ) {
                    headers.set(
                        "Authorization",
                        `Bearer ${token}`
                    );
                }

            }

            let response =
                await originalFetch(input, {
                    ...init,
                    headers
                });

            // if (
            //     response.status !== 401
            // ) {
            //     if (!isApi) {
            //         return response;
            //     }
            // }
            if (response.status !== 401) {
                return response;
            }

            // Don't refresh the refresh request itself
            if (
                typeof input === "string" &&
                input.includes("/auth/refresh")
            ) {
                return response;
            }

            const refreshResponse = await originalFetch(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
                {
                    method: 'POST',
                    credentials: 'include', // sends the refreshToken cookie
                }
            );

            if (!refreshResponse.ok) {

                localStorage.removeItem("token");

                window.location.href =
                    "/login";

                return response;

            }

            const refreshData =
                await refreshResponse.json();

            localStorage.setItem(
                "token",
                refreshData.token
            );

            headers.set(
                "Authorization",
                `Bearer ${refreshData.token}`
            );

            return originalFetch(
                input,
                {
                    ...init,
                    headers
                }
            );

        };

        return () => {

            window.fetch =
                originalFetch;

        };

    }, []);

    return children;

}