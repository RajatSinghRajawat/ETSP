import { LOOKUP_CATEGORIES, LOOKUP_CATEGORY_LABELS } from '../constants/lookup-categories.js';
import {
  approveOption,
  createOptionAdmin,
  deleteOptionAdmin,
  disableOption,
  getOptionById,
  listAdminOptions,
  listPublicOptions,
  proposeOption,
  rejectOption,
  updateOptionAdmin,
} from '../services/lookup-option.service.js';

export async function listLookupCategoriesHandler() {
  return {
    success: true,
    message: 'Lookup categories fetched successfully',
    data: {
      items: LOOKUP_CATEGORIES.map((key) => ({
        key,
        label: LOOKUP_CATEGORY_LABELS[key] ?? key,
      })),
    },
  };
}

export async function listPublicLookupsHandler(request) {
  const items = await listPublicOptions(request.params.category, request.query);
  return {
    success: true,
    message: 'Lookup options fetched successfully',
    data: items,
  };
}

export async function proposeLookupHandler(request) {
  const result = await proposeOption(request.params.category, request.body?.name, request.user);
  return {
    success: true,
    message: result.message,
    data: result.item,
  };
}

export async function listAdminLookupsHandler(request) {
  const data = await listAdminOptions(request.query);
  return {
    success: true,
    message: 'Lookup options fetched successfully',
    data,
  };
}

export async function getAdminLookupHandler(request) {
  const data = await getOptionById(request.params.id);
  return {
    success: true,
    message: 'Lookup option fetched successfully',
    data,
  };
}

export async function createAdminLookupHandler(request) {
  const data = await createOptionAdmin(request.body, request.user);
  return {
    success: true,
    message: 'Lookup option created successfully',
    data,
  };
}

export async function updateAdminLookupHandler(request) {
  const data = await updateOptionAdmin(request.params.id, request.body);
  return {
    success: true,
    message: 'Lookup option updated successfully',
    data,
  };
}

export async function deleteAdminLookupHandler(request) {
  await deleteOptionAdmin(request.params.id);
  return {
    success: true,
    message: 'Lookup option deleted successfully',
    data: null,
  };
}

export async function approveAdminLookupHandler(request) {
  const data = await approveOption(request.params.id, request.user);
  return {
    success: true,
    message: 'Lookup option approved and published',
    data,
  };
}

export async function rejectAdminLookupHandler(request) {
  const data = await rejectOption(request.params.id, request.user, request.body?.reason);
  return {
    success: true,
    message: 'Lookup option rejected',
    data,
  };
}

export async function disableAdminLookupHandler(request) {
  const data = await disableOption(request.params.id);
  return {
    success: true,
    message: 'Lookup option disabled',
    data,
  };
}
