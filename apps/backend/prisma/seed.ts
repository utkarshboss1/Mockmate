import { PrismaClient } from '@prisma/client';
import { UserRole, ExperienceLevel, UserStatus } from '@interviewiq/shared';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding Supabase database...');

  // 1. Create sample Interviewer User & Profile
  const _interviewerUser1 = await prisma.user.upsert({
    where: { email: 'priya.sharma@example.com' },
    update: {},
    create: {
      id: 'usr_int_1',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      role: UserRole.INTERVIEWER,
      status: 'ACTIVE',
      interviewerProfile: {
        create: {
          id: 'int_1',
          headline: 'Senior Staff Engineer @ Google (Ex-Meta)',
          bio: '10+ years conducting system design and coding interviews. Helped 150+ engineers land L5/L6 offers at FAANG.',
          company: 'Google',
          jobTitle: 'Staff Software Engineer',
          yearsOfExperience: 10,
          pricePerHour: 150000, // ₹1,500 in paise
          experienceLevel: ExperienceLevel.SENIOR,
          averageRating: 4.9,
          totalReviews: 48,
          totalInterviews: 120,
          isVerified: true,
        },
      },
    },
  });

  const _interviewerUser2 = await prisma.user.upsert({
    where: { email: 'rahul.verma@example.com' },
    update: {},
    create: {
      id: 'usr_int_2',
      name: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      role: UserRole.INTERVIEWER,
      status: 'ACTIVE',
      interviewerProfile: {
        create: {
          id: 'int_2',
          headline: 'Principal Architect @ Amazon AWS',
          bio: 'Specialist in distributed systems, High Throughput Microservices, and Low-Latency Cloud Architectures.',
          company: 'Amazon',
          jobTitle: 'Principal Solutions Architect',
          yearsOfExperience: 12,
          pricePerHour: 200000, // ₹2,000 in paise
          experienceLevel: ExperienceLevel.PRINCIPAL,
          averageRating: 5.0,
          totalReviews: 62,
          totalInterviews: 155,
          isVerified: true,
        },
      },
    },
  });

  // 2. Create Candidate User
    const _candidateUser = await prisma.user.upsert({
      where: { email: 'candidate@example.com' },
      update: {},
      create: {
        id: 'usr_cand_1',
        name: 'Alex Johnson',
        email: 'candidate@example.com',
        role: UserRole.CANDIDATE,
        status: UserStatus.ACTIVE,
      },
    });

    // 3. Create Admin User
    const _adminUser = await prisma.user.upsert({
      where: { email: 'admin@mockmate.in' },
      update: {},
      create: {
        id: 'usr_admin_1',
        name: 'MockMate Admin',
        email: 'admin@mockmate.in',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    console.log('✅ Seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
