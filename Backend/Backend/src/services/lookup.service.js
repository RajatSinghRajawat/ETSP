import { AppError } from '../utils/app-error.js';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function ensureValidId(id, label) {
  if (!OBJECT_ID_REGEX.test(String(id))) {
    throw new AppError(`${label} not found`, 404);
  }
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (['true', '1', 'yes'].includes(value.toLowerCase())) return true;
    if (['false', '0', 'no'].includes(value.toLowerCase())) return false;
  }
  return undefined;
}

function buildListFilters(query = {}) {
  const filters = {};
  const includeInactive = toBoolean(query.includeInactive);

  if (includeInactive !== true) {
    filters.isActive = true;
  }

  if (query.search) {
    const keyword = String(query.search).trim();
    if (keyword) {
      filters.name = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
  }

  return filters;
}

export function createLookupService(Model, label) {
  async function list(query = {}) {
    const filters = buildListFilters(query);
    return Model.find(filters).sort({ order: 1, name: 1 }).lean();
  }

  async function getById(id) {
    ensureValidId(id, label);
    const item = await Model.findById(id).lean();
    if (!item) {
      throw new AppError(`${label} not found`, 404);
    }
    return item;
  }

  async function create(input) {
    try {
      const created = await Model.create(input);
      return created.toObject();
    } catch (error) {
      if (error?.code === 11000) {
        throw new AppError(`${label} with the same name or value already exists`, 409);
      }
      throw error;
    }
  }

  async function update(id, input) {
    ensureValidId(id, label);
    try {
      const updated = await Model.findByIdAndUpdate(id, input, {
        new: true,
        runValidators: true,
      }).lean();
      if (!updated) {
        throw new AppError(`${label} not found`, 404);
      }
      return updated;
    } catch (error) {
      if (error?.code === 11000) {
        throw new AppError(`${label} with the same name or value already exists`, 409);
      }
      throw error;
    }
  }

  async function remove(id) {
    ensureValidId(id, label);
    const deleted = await Model.findByIdAndDelete(id).lean();
    if (!deleted) {
      throw new AppError(`${label} not found`, 404);
    }
    return deleted;
  }

  return { list, getById, create, update, remove };
}
