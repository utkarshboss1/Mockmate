// ============================================================
// mockStore/index.ts — In-Memory Store (DB-offline Dev Mode)
//
// PURPOSE
//   Lets the backend boot and serve end-to-end without a reachable
//   Postgres. Used while the team is on a college IPv4 LAN where
//   Supabase (and other paid IPv4 providers) are unreachable.
//
// WHEN TO USE
//   - STORAGE_MODE=memory   → every read/write hits these Maps
//   - STORAGE_MODE=database → all calls route to Prisma
//
// WHEN TO DELETE
//   When STORAGE_MODE=database is the only supported mode in prod,
//   this folder and the memory branches in every repository/service
//   can be removed in one PR. Until then, keep it isolated so the
//   dev path stays obvious.
// ============================================================

export { mockUserStore } from './userStore';
export { mockBookingStore } from './bookingStore';
export { STORAGE_MODE, isMockStorage } from './mode';
