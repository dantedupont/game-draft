'use client'

// TRPC client and React Query wrapper
import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from './client'

export function TRPCProvider({ children }: { children: React.ReactNode }) {
    // React Query client instance
    const [queryClient] = useState(() => new QueryClient({}))

    const [trpcClient] = useState(() => 
    trpc.createClient({
        links: [
            httpBatchLink({
                url: `${getBaseUrl()}/api/trpc`
            })
        ]
    }))

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    )
}

//helper function to get base URL for API calls
function getBaseUrl() {
    if (typeof window !== 'undefined') return '';
    //for Vercel deployment:
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    //for dev, use localhost
    return `https://localhost:${process.env.PORT ?? 3000}`
}
