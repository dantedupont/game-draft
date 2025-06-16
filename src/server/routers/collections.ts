import { router, publicProcedure } from '../trpc'
//import { db } from '@/db/drizzle'
import { user } from '@/db/schema'
//import { z } from 'zod'

export const collectionRouter = router({
    testDbConnection: publicProcedure
        .query(async ({ ctx }) => {
            try {
                const usersCount = await ctx.db.select().from(user).execute()
                return { success: true, message: `DB conntected! Found ${usersCount.length} users`, count: usersCount.length }
            } catch (error) {
                console.log("Error testing DB connection via TRPC", error);
                throw new Error("Failed to connect to database via TRPC")
                
            }
        })
})