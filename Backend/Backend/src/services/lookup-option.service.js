import { LOOKUP_CATEGORIES } from '../constants/lookup-categories.js';
import { LookupOption } from '../models/lookup-option.model.js';
import { AppError } from '../utils/app-error.js';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function ensureValidId(id) {
  if (!OBJECT_ID_REGEX.test(String(id))) {
    throw new AppError('Lookup option not found', 404);
  }
}

export function assertCategory(category) {
  if (!LOOKUP_CATEGORIES.includes(category)) {
    throw new AppError(`Unknown lookup category: ${category}`, 400);
  }
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function normalizeName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ');
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (['true', '1', 'yes'].includes(value.toLowerCase())) return true;
    if (['false', '0', 'no'].includes(value.toLowerCase())) return false;
  }
  return undefined;
}

/**
 * Public catalog: approved + active only.
 * Shape matches the legacy lookup list so existing Ets clients keep working.
 */
export async function listPublicOptions(category, query = {}) {
  assertCategory(category);

  const filters = {
    category,
    status: 'approved',
    isActive: true,
  };

  if (query.search) {
    const keyword = String(query.search).trim();
    if (keyword) {
      filters.name = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
  }

  return LookupOption.find(filters).sort({ order: 1, name: 1 }).lean();
}

/** Admin list with status / search / inactive filters. */
export async function listAdminOptions(query = {}) {
  const filters = {};

  if (query.category) {
    assertCategory(query.category);
    filters.category = query.category;
  }

  if (query.status) {
    filters.status = String(query.status);
  }

  const includeInactive = toBoolean(query.includeInactive);
  if (includeInactive !== true && !query.status) {
    // Default admin view still shows everything unless filtered;
    // only hide inactive when explicitly requested via isActive=true.
  }

  if (query.isActive === 'true') filters.isActive = true;
  if (query.isActive === 'false') filters.isActive = false;

  if (query.search) {
    const keyword = String(query.search).trim();
    if (keyword) {
      filters.$or = [
        { name: new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        { value: new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      ];
    }
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(query.limit) || 100));
  const skip = (page - 1) * limit;

  const [items, total, pendingCount] = await Promise.all([
    LookupOption.find(filters).sort({ status: 1, order: 1, name: 1 }).skip(skip).limit(limit).lean(),
    LookupOption.countDocuments(filters),
    LookupOption.countDocuments({ status: 'pending' }),
  ]);

  return {
    items,
    pendingCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getOptionById(id) {
  ensureValidId(id);
  const item = await LookupOption.findById(id).lean();
  if (!item) throw new AppError('Lookup option not found', 404);
  return item;
}

export async function createOptionAdmin(input, adminUser) {
  assertCategory(input.category);
  const name = normalizeName(input.name);
  if (!name) throw new AppError('Name is required', 400);

  const value = input.value?.trim() || slugify(name);
  if (!value) throw new AppError('Value is required', 400);

  try {
    const created = await LookupOption.create({
      category: input.category,
      name,
      value,
      description: input.description ?? '',
      order: input.order ?? 0,
      status: input.status ?? 'approved',
      isActive: input.isActive !== false,
      proposedBy: null,
      proposedByEmail: '',
      reviewedBy: adminUser?.id ?? null,
      reviewedAt: new Date(),
    });
    return created.toObject();
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('An option with the same name or value already exists in this category', 409);
    }
    throw error;
  }
}

export async function updateOptionAdmin(id, input) {
  ensureValidId(id);
  const patch = {};

  if (input.name !== undefined) patch.name = normalizeName(input.name);
  if (input.value !== undefined) patch.value = String(input.value).trim();
  if (input.description !== undefined) patch.description = String(input.description).trim();
  if (input.order !== undefined) patch.order = input.order;
  if (input.isActive !== undefined) patch.isActive = input.isActive;
  if (input.status !== undefined) patch.status = input.status;

  if (Object.keys(patch).length === 0) {
    throw new AppError('Provide at least one field to update', 400);
  }

  try {
    const updated = await LookupOption.findByIdAndUpdate(id, { $set: patch }, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) throw new AppError('Lookup option not found', 404);
    return updated;
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('An option with the same name or value already exists in this category', 409);
    }
    throw error;
  }
}

export async function deleteOptionAdmin(id) {
  ensureValidId(id);
  const deleted = await LookupOption.findByIdAndDelete(id).lean();
  if (!deleted) throw new AppError('Lookup option not found', 404);
  return deleted;
}

export async function approveOption(id, adminUser) {
  ensureValidId(id);
  const updated = await LookupOption.findByIdAndUpdate(
    id,
    {
      $set: {
        status: 'approved',
        isActive: true,
        reviewedBy: adminUser?.id ?? null,
        reviewedAt: new Date(),
        rejectionReason: '',
      },
    },
    { new: true },
  ).lean();
  if (!updated) throw new AppError('Lookup option not found', 404);
  return updated;
}

export async function rejectOption(id, adminUser, reason = '') {
  ensureValidId(id);
  const updated = await LookupOption.findByIdAndUpdate(
    id,
    {
      $set: {
        status: 'rejected',
        isActive: false,
        reviewedBy: adminUser?.id ?? null,
        reviewedAt: new Date(),
        rejectionReason: String(reason ?? '').trim().slice(0, 400),
      },
    },
    { new: true },
  ).lean();
  if (!updated) throw new AppError('Lookup option not found', 404);
  return updated;
}

export async function disableOption(id) {
  ensureValidId(id);
  const updated = await LookupOption.findByIdAndUpdate(
    id,
    { $set: { status: 'disabled', isActive: false } },
    { new: true },
  ).lean();
  if (!updated) throw new AppError('Lookup option not found', 404);
  return updated;
}

/**
 * Authenticated user proposes a new select value.
 * Dedupes against existing approved/pending rows in the same category.
 */
export async function proposeOption(category, nameInput, user) {
  assertCategory(category);
  const name = normalizeName(nameInput);
  if (!name || name.length < 2) {
    throw new AppError('Please enter a name (at least 2 characters)', 400);
  }
  if (name.length > 160) {
    throw new AppError('Name is too long', 400);
  }

  const value = slugify(name) || name.toLowerCase();

  const existing = await LookupOption.findOne({
    category,
    $or: [
      { value },
      { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    ],
  }).lean();

  if (existing) {
    if (existing.status === 'approved' && existing.isActive) {
      return {
        item: existing,
        created: false,
        message: 'This option already exists and is available in the list.',
      };
    }
    if (existing.status === 'pending') {
      return {
        item: existing,
        created: false,
        message: 'This option is already waiting for admin approval.',
      };
    }
    if (existing.status === 'rejected' || existing.status === 'disabled' || !existing.isActive) {
      // Re-open for review instead of creating a duplicate.
      const reopened = await LookupOption.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            name,
            status: 'pending',
            isActive: false,
            proposedBy: user?.id ?? null,
            proposedByEmail: user?.email ?? '',
            reviewedBy: null,
            reviewedAt: null,
            rejectionReason: '',
          },
        },
        { new: true },
      ).lean();
      return {
        item: reopened,
        created: true,
        message: 'Submitted for admin approval.',
      };
    }
  }

  try {
    const created = await LookupOption.create({
      category,
      name,
      value,
      description: '',
      order: 9999,
      status: 'pending',
      isActive: false,
      proposedBy: user?.id ?? null,
      proposedByEmail: user?.email ?? '',
    });
    return {
      item: created.toObject(),
      created: true,
      message: 'Submitted for admin approval. It will appear in the list once approved.',
    };
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('This option already exists', 409);
    }
    throw error;
  }
}
