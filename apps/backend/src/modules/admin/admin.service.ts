// ============================================================
// admin.service.ts — Admin Business Logic Layer
// ============================================================

import { adminRepository, AdminRepository } from './admin.repository';
import { AdminUserQueryInput } from './admin.validator';
import { UserStatus } from '@interviewiq/shared';
import { buildPaginationMeta } from '../../types';

export class AdminService {
  constructor(private repository: AdminRepository) {}

  async getAnalyticsOverview() {
    return this.repository.getAnalyticsOverview();
  }

  async listUsers(query: AdminUserQueryInput) {
    const { total, items } = await this.repository.listUsers(query);
    const meta = buildPaginationMeta(total, query.page, query.limit);
    return { items, meta };
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    return this.repository.updateUserStatus(userId, status);
  }
}

export const adminService = new AdminService(adminRepository);
