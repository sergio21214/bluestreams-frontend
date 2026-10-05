'use client';

import { useEffect } from 'react';

export default function FetchInterceptor() {

    useEffect(() => {

        const originalFetch = window.fetch;

        window.fetch = async (
            input: RequestInfo | URL,
            init?: RequestInit
        ) => {

            try {

                const response = await originalFetch(input, init);

                if (response.status === 401) {

                    console.warn("Session expired.");

                    localStorage.clear();

                    window.location.href = "/login";

                }

                return response;

            } catch (err) {

                console.error(err);

                throw err;

            }

        };

        return () => {

            window.fetch = originalFetch;

        };

    }, []);

    return null;

}