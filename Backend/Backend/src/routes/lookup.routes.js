import { JobType } from '../models/job-type.model.js';
import { Skill } from '../models/skill.model.js';
import { Education } from '../models/education.model.js';
import { SalaryUnit } from '../models/salary-unit.model.js';
import { createLookupService } from '../services/lookup.service.js';
import { createLookupController } from '../controllers/lookup.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  buildLookupCreateSchema,
  buildLookupUpdateSchema,
} from '../validations/lookup.validation.js';

function buildResourceRoutes({ Model, labels, schemaOptions }) {
  const service = createLookupService(Model, labels.singular);
  const controller = createLookupController(service, labels);
  const createSchema = buildLookupCreateSchema(schemaOptions);
  const updateSchema = buildLookupUpdateSchema(schemaOptions);

  return async function resourceRoutes(app) {
    app.get('/', controller.listItems);
    app.get('/:id', controller.getItem);
    app.post(
      '/',
      { preHandler: [authenticate, validateBody(createSchema)] },
      controller.createItem,
    );
    app.put(
      '/:id',
      { preHandler: [authenticate, validateBody(updateSchema)] },
      controller.updateItem,
    );
    app.delete('/:id', { preHandler: authenticate }, controller.deleteItem);
  };
}

export const jobTypeRoutes = buildResourceRoutes({
  Model: JobType,
  labels: { singular: 'Job type', plural: 'Job types' },
  schemaOptions: { nameMax: 60, valueMax: 60 },
});

export const skillRoutes = buildResourceRoutes({
  Model: Skill,
  labels: { singular: 'Skill', plural: 'Skills' },
  schemaOptions: { nameMax: 80, valueMax: 80 },
});

export const educationRoutes = buildResourceRoutes({
  Model: Education,
  labels: { singular: 'Education', plural: 'Educations' },
  schemaOptions: { nameMax: 120, valueMax: 60 },
});

export const salaryUnitRoutes = buildResourceRoutes({
  Model: SalaryUnit,
  labels: { singular: 'Salary unit', plural: 'Salary units' },
  schemaOptions: { nameMax: 40, valueMax: 40 },
});
