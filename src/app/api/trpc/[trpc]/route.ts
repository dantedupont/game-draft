import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/routers/index'
import { createContext } from '@/server/trpc'

const handler = (req: Request) =>
    fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext: () => createContext({ req, resHeaders: new Headers() }),
        onError:
            process.env.NODE_ENV === 'development'
                ? ({ path, error }) => {
                    console.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, error);
                }
                : undefined,
    })

    export { handler as GET, handler as POST }