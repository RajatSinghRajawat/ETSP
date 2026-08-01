// Grandfathers in profiles that existed before the admin-approval gate was
// added: they already went through the site unblocked, so they should not
// suddenly be locked out of login. New registrations still default to
// 'pending' via the schema and require an explicit admin approval.
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { CandidateProfile } from '../src/models/candidate-profile.model.js';
import { EmployerProfile } from '../src/models/employer-profile.model.js';
import { Job } from '../src/models/job.model.js';
import { logger } from '../src/utils/logger.js';

async function run() {
  await connectDatabase();

  for (const [label, Model] of [
    ['Candidate', CandidateProfile],
    ['Employer', EmployerProfile],
    ['Job', Job],
  ]) {
    const grandfathered = await Model.updateMany(
      { approvalStatus: { $exists: false } },
      { $set: { approvalStatus: 'approved' } },
    );
    logger.info(`${label} profiles grandfathered to approved: ${grandfathered.modifiedCount}`);

    // The not-yet-approved state was originally called 'pending'; it is now
    // 'rejected' so the admin list reads as a hard block. Leaving the old
    // value in place would fail schema validation on the next write.
    const renamed = await Model.updateMany(
      { approvalStatus: 'pending' },
      { $set: { approvalStatus: 'rejected' } },
    );
    logger.info(`${label} profiles migrated pending -> rejected: ${renamed.modifiedCount}`);
  }

  await disconnectDatabase();
  logger.info('Done.');
}

run().catch((error) => {
  logger.error(error);
  process.exit(1);
});
