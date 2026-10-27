// ============================================================
// mockStore/index.ts — In-Memory Store (Explicit Demo Mode)
//
// PURPOSE
//   Serves demo data when STORAGE_MODE=memory is explicitly selected.
//   PostgreSQL connectivity never changes the selected mode.
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
