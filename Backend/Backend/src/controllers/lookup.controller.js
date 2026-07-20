export function createLookupController(service, labels) {
  async function listItems(request) {
    const items = await service.list(request.query);
    return {
      success: true,
      message: `${labels.plural} fetched successfully`,
      data: items,
    };
  }

  async function getItem(request) {
    const item = await service.getById(request.params.id);
    return {
      success: true,
      message: `${labels.singular} fetched successfully`,
      data: item,
    };
  }

  async function createItem(request, reply) {
    const item = await service.create(request.body);
    return reply.code(201).send({
      success: true,
      message: `${labels.singular} created successfully`,
      data: item,
    });
  }

  async function updateItem(request) {
    const item = await service.update(request.params.id, request.body);
    return {
      success: true,
      message: `${labels.singular} updated successfully`,
      data: item,
    };
  }

  async function deleteItem(request) {
    await service.remove(request.params.id);
    return {
      success: true,
      message: `${labels.singular} deleted successfully`,
    };
  }

  return { listItems, getItem, createItem, updateItem, deleteItem };
}
