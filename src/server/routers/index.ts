import { router, publicProcedure } from '../trpc'; 
import { z } from 'zod'
import { collectionRouter } from './collections'
import { aiRouter } from './ai'

export const appRouter = router({
    ai: aiRouter,
    //test procedure:
    greeting: router({
        hello: publicProcedure
            .input(z.object({ name: z.string().optional() }))
            .query(({ input }) => {
                return `Helo, ${input.name ?? 'world'}! From tRPC!`
            })
    }),
    collection: collectionRouter
})

export type AppRouter = typeof appRouter