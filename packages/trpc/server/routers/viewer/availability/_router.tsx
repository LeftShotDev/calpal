import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { ZCalendarOverlayInputSchema } from "./calendarOverlay.schema";
import { scheduleRouter } from "./schedule/_router";
import { ZListTeamAvailaiblityScheme } from "./team/listTeamAvailability.schema";
import { ZUserInputSchema } from "./user.schema";
import {
	ZListAvailabilityBlocksInputSchema,
	ZCreateAvailabilityBlockInputSchema,
	ZUpdateAvailabilityBlockInputSchema,
	ZDeleteAvailabilityBlockInputSchema,
	listAvailabilityBlocksHandler,
	createAvailabilityBlockHandler,
	updateAvailabilityBlockHandler,
	deleteAvailabilityBlockHandler,
} from "./minimalScheduler";

export const availabilityRouter = router({
  list: authedProcedure.query(async ({ ctx }) => {
    const { listHandler } = await import("./list.handler");

    return listHandler({
      ctx,
    });
  }),

  user: authedProcedure.input(ZUserInputSchema).query(async ({ ctx, input }) => {
    const { userHandler } = await import("./user.handler");

    return userHandler({
      ctx,
      input,
    });
  }),
  listTeam: authedProcedure.input(ZListTeamAvailaiblityScheme).query(async ({ ctx, input }) => {
    const { listTeamAvailabilityHandler } = await import("./team/listTeamAvailability.handler");

    return listTeamAvailabilityHandler({
      ctx,
      input,
    });
  }),
  schedule: scheduleRouter,
  calendarOverlay: authedProcedure.input(ZCalendarOverlayInputSchema).query(async ({ ctx, input }) => {
    const { calendarOverlayHandler } = await import("./calendarOverlay.handler");

    return calendarOverlayHandler({
      ctx,
      input,
    });
  }),
  // Minimal scheduler availability blocks
  listBlocks: authedProcedure
    .input(ZListAvailabilityBlocksInputSchema)
    .query(async ({ ctx, input }) => {
      return listAvailabilityBlocksHandler({ ctx, input });
    }),
  createBlock: authedProcedure
    .input(ZCreateAvailabilityBlockInputSchema)
    .mutation(async ({ ctx, input }) => {
      return createAvailabilityBlockHandler({ ctx, input });
    }),
  updateBlock: authedProcedure
    .input(ZUpdateAvailabilityBlockInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updateAvailabilityBlockHandler({ ctx, input });
    }),
  deleteBlock: authedProcedure
    .input(ZDeleteAvailabilityBlockInputSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteAvailabilityBlockHandler({ ctx, input });
    }),
});
