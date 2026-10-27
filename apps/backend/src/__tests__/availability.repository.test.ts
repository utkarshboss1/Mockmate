import { afterEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.STORAGE_MODE = 'database';
});

import { prisma } from '../lib/prisma';
import { AvailabilityRepository } from '../modules/availability/availability.repository';

describe('AvailabilityRepository database mode', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns no slots when an interviewer has no real availability', async () => {
    const findMany = vi
      .spyOn(prisma.availabilitySlot, 'findMany')
      .mockResolvedValue([] as never);
    const repository = new AvailabilityRepository();

    await expect(repository.getSlotsByInterviewerProfileId('interviewer-1')).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      where: { interviewerProfileId: 'interviewer-1' },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  });

  it('propagates availability query failures instead of substituting sample slots', async () => {
    const databaseError = new Error('database unavailable');
    vi.spyOn(prisma.availabilitySlot, 'findMany').mockRejectedValue(databaseError);
    const repository = new AvailabilityRepository();

    await expect(repository.getSlotsByInterviewerProfileId('interviewer-1')).rejects.toBe(
      databaseError,
    );
  });
});
