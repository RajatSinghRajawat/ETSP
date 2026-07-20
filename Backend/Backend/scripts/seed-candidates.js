import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { CandidateProfile } from '../src/models/candidate-profile.model.js';
import { User } from '../src/models/user.model.js';
import { logger } from '../src/utils/logger.js';
import { CANDIDATE_SEEDS } from './candidate-seeds.data.js';

async function upsertCandidate(seed) {
  const exists = await CandidateProfile.findOne({
    $or: [{ email: seed.email }, { phone: seed.phone }],
  })
    .select('_id email')
    .lean();

  if (exists) {
    logger.info(`Skipping existing candidate: ${seed.email}`);
    return { created: false };
  }

  await User.updateOne(
    { email: seed.email },
    { $setOnInsert: { email: seed.email, role: 'candidate', isActive: true } },
    { upsert: true },
  );

  await CandidateProfile.create(seed);
  logger.info(`Created candidate: ${seed.firstName} ${seed.lastName} (${seed.email})`);
  return { created: true };
}

async function run() {
  await connectDatabase();
  let created = 0;
  let skipped = 0;
  try {
    for (const seed of CANDIDATE_SEEDS) {
      const result = await upsertCandidate(seed);
      if (result.created) created += 1;
      else skipped += 1;
    }
    logger.info(`Done. Created: ${created}, Skipped: ${skipped}`);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

run();
