// ============================================================
// users.service.ts — Users & Profiles Business Logic Layer
// ============================================================

import { usersRepository, UsersRepository } from './users.repository';
import { UpdateCandidateProfileInput, UpdateInterviewerProfileInput } from './users.validator';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { errors } from '../../middleware/error.middleware';

export class UsersService {
  constructor(private repository: UsersRepository) {}

  async getUserProfile(userId: string) {
    const user = await this.repository.getUserById(userId);
    if (!user) {
      throw errors.notFound('User profile');
    }
    return user;
  }

  async updateCandidateProfile(userId: string, input: UpdateCandidateProfileInput) {
    return this.repository.updateCandidateProfile(userId, input);
  }

  async updateInterviewerProfile(userId: string, input: UpdateInterviewerProfileInput) {
    return this.repository.updateInterviewerProfile(userId, input);
  }

  async uploadAvatar(userId: string, fileBuffer: Buffer) {
    const { url } = await uploadImageToCloudinary(fileBuffer, 'interviewiq/avatars');
    await this.repository.updateCandidateProfile(userId, { name: (await this.getUserProfile(userId)).name, avatar: url });
    return { avatarUrl: url };
  }

  async getTags() {
    return this.repository.getAllTags();
  }
}

export const usersService = new UsersService(usersRepository);
