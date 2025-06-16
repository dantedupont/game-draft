import { initTRPC, TRPCError } from '@trpc/server'
import { db } from '@/db/drizzle'
// import { auth } from '@/utils/auth'

interface AppRouterContextOptions {
    req: Request;
    resHeaders: Headers;
}

export const createContext = async (opts: AppRouterContextOptions) => {
    const { req } = opts

    const user = null //placeholder

    return {
        db,
        user,
    }
}

// initialize trpcs
const t = initTRPC.context<typeof createContext>().create()

// base router and procedures
export const router = t.router
export const publicProcedure = t.procedure;  // for publuc procedures

export const protectedProcedure = t.procedure.use(
    t.middleware(async ({ ctx, next }) => {
        if(!ctx.user){
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated'})
        }
        return next({
            ctx: {
                ...ctx,
                user: ctx.user
            }
        })
    })
)

