import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getTrendingProductsProcedure } from "./routes/trending/get/route";
import { updateTrendingProductsProcedure } from "./routes/trending/update/route";
import { resetPasswordProcedure } from "./routes/auth/reset-password/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  trending: createTRPCRouter({
    get: getTrendingProductsProcedure,
    update: updateTrendingProductsProcedure,
  }),
  auth: createTRPCRouter({
    resetPassword: resetPasswordProcedure,
  }),
});

export type AppRouter = typeof appRouter;