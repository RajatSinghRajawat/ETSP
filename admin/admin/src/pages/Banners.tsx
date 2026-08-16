import {
  Badge,
  Box,
  Button,
  Checkbox,
  Drawer,
  Field,
  Flex,
  HStack,
  IconButton,
  Image,
  Input,
  Menu,
  Portal,
  Spinner,
  Stack,
  Switch,
  Table,
  Text,
  Wrap,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { FiEdit2, FiExternalLink, FiMoreVertical, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { PageHeader } from '../components/PageHeader';
import { toaster } from '../components/Toaster';
import {
  useBannerPlacements,
  useBanners,
  useCreateBanner,
  useDeleteBanner,
  useUpdateBanner,
  useUploadBannerImage,
  type BannerInput,
} from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import { formatDate } from '../lib/format';
import type { BannerRow } from '../types';

interface FormState {
  title: string;
  linkUrl: string;
  altText: string;
  placements: string[];
  isActive: boolean;
  sortOrder: string;
  startsAt: string;
  endsAt: string;
}

const emptyForm = (): FormState => ({
  title: '',
  linkUrl: '',
  altText: '',
  placements: [],
  isActive: true,
  sortOrder: '0',
  startsAt: '',
  endsAt: '',
});

/** The API returns full ISO timestamps; <input type="date"> wants YYYY-MM-DD. */
const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '');

export default function Banners() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BannerRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: banners, isLoading, error } = useBanners();
  const placements = useBannerPlacements();
  const uploadImage = useUploadBannerImage();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  // The preview is an object URL while the pick is still local; revoking it on
  // replacement keeps the blob from being held for the life of the page.
  useEffect(() => {
    if (!localPreview) return;
    return () => URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const placementLabel = (key: string) =>
    placements.data?.find((p) => p.key === key)?.label ?? key;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setImageUrl('');
    setImageFile(null);
    setLocalPreview(null);
    setDrawerOpen(true);
  }

  function openEdit(row: BannerRow) {
    setEditing(row);
    setForm({
      title: row.title,
      linkUrl: row.linkUrl,
      altText: row.altText ?? '',
      placements: row.placements,
      isActive: row.isActive,
      sortOrder: String(row.sortOrder),
      startsAt: toDateInput(row.startsAt),
      endsAt: toDateInput(row.endsAt),
    });
    setImageUrl(row.imageUrl);
    setImageFile(null);
    setLocalPreview(null);
    setDrawerOpen(true);
  }

  function togglePlacement(key: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      placements: checked ? [...f.placements, key] : f.placements.filter((p) => p !== key),
    }));
  }

  /** Held locally until save — a cancelled drawer must not leave a file on the server. */
  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImageFile(file);
    setLocalPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toaster.create({ title: 'Give the banner a title', type: 'error' });
      return;
    }
    if (!imageFile && !imageUrl) {
      toaster.create({ title: 'Upload a banner image', type: 'error' });
      return;
    }
    if (!/^https?:\/\//i.test(form.linkUrl.trim())) {
      toaster.create({ title: 'Link must start with http:// or https://', type: 'error' });
      return;
    }
    if (form.placements.length === 0) {
      toaster.create({ title: 'Pick at least one place to show the banner', type: 'error' });
      return;
    }

    let savedImageUrl = imageUrl;
    if (imageFile) {
      try {
        savedImageUrl = (await uploadImage.mutateAsync(imageFile)).url;
      } catch (err) {
        toaster.create({
          title: 'Image upload failed',
          description: extractErrorMessage(err),
          type: 'error',
        });
        return;
      }
    }

    const body: BannerInput = {
      title: form.title.trim(),
      imageUrl: savedImageUrl,
      linkUrl: form.linkUrl.trim(),
      altText: form.altText.trim(),
      placements: form.placements,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    };

    const onSuccess = () => {
      toaster.create({ title: editing ? 'Banner updated' : 'Banner created', type: 'success' });
      setDrawerOpen(false);
    };
    const onError = (err: unknown) =>
      toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' });

    if (editing) {
      updateBanner.mutate({ id: editing._id, body }, { onSuccess, onError });
    } else {
      createBanner.mutate(body, { onSuccess, onError });
    }
  }

  function handleActiveToggle(row: BannerRow, isActive: boolean) {
    updateBanner.mutate(
      { id: row._id, body: { isActive } },
      {
        onSuccess: () =>
          toaster.create({
            title: isActive ? 'Banner is live' : 'Banner hidden from the site',
            type: 'success',
          }),
        onError: (err) =>
          toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  const previewSrc = localPreview ?? imageUrl;
  const saving = uploadImage.isPending || createBanner.isPending || updateBanner.isPending;

  return (
    <Box>
      <PageHeader
        title="Banners"
        description="Advertisement banners shown across the website. Visitors who click one are sent to its link."
        actions={
          <Button colorPalette="brand" onClick={openCreate}>
            <FiPlus style={{ marginRight: 8 }} /> New banner
          </Button>
        }
      />

      <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
        {isLoading ? (
          <Flex py={12} justify="center"><Spinner /></Flex>
        ) : error ? (
          <Box p={6}><Text color="red.600">{extractErrorMessage(error)}</Text></Box>
        ) : !banners || banners.length === 0 ? (
          <Box p={8} textAlign="center">
            <Text color="gray.500">
              No banners yet. Create one to start showing ads on the website.
            </Text>
          </Box>
        ) : (
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader>Banner</Table.ColumnHeader>
                <Table.ColumnHeader>Shown on</Table.ColumnHeader>
                <Table.ColumnHeader>Schedule</Table.ColumnHeader>
                <Table.ColumnHeader>Clicks</Table.ColumnHeader>
                <Table.ColumnHeader>Live</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {banners.map((row) => (
                <Table.Row key={row._id}>
                  <Table.Cell>
                    <HStack gap={3} align="start">
                      <Image
                        src={row.imageUrl}
                        alt={row.altText || row.title}
                        width="96px"
                        height="54px"
                        objectFit="cover"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="gray.200"
                        bg="gray.50"
                      />
                      <Box>
                        <Text fontWeight="semibold">{row.title}</Text>
                        <HStack gap={1} color="gray.500" fontSize="xs">
                          <FiExternalLink />
                          <Text truncate maxW="260px">{row.linkUrl}</Text>
                        </HStack>
                      </Box>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Wrap gap={1}>
                      {row.placements.map((key) => (
                        <Badge key={key} colorPalette="blue" variant="subtle">
                          {placementLabel(key)}
                        </Badge>
                      ))}
                    </Wrap>
                  </Table.Cell>
                  <Table.Cell color="gray.600" fontSize="sm">
                    {row.startsAt || row.endsAt
                      ? `${row.startsAt ? formatDate(row.startsAt) : 'Now'} → ${row.endsAt ? formatDate(row.endsAt) : 'No end'}`
                      : 'Always'}
                  </Table.Cell>
                  <Table.Cell>{row.clickCount}</Table.Cell>
                  <Table.Cell>
                    <Switch.Root
                      checked={row.isActive}
                      onCheckedChange={(d) => handleActiveToggle(row, d.checked)}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                    </Switch.Root>
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <IconButton aria-label="Actions" variant="ghost" size="sm">
                          <FiMoreVertical />
                        </IconButton>
                      </Menu.Trigger>
                      <Portal>
                        <Menu.Positioner>
                          <Menu.Content>
                            <Menu.Item value="edit" onClick={() => openEdit(row)}>
                              <FiEdit2 style={{ marginRight: 8 }} /> Edit
                            </Menu.Item>
                            <Menu.Item value="delete" color="red.600" onClick={() => setDeleteTarget(row)}>
                              <FiTrash2 style={{ marginRight: 8 }} /> Delete
                            </Menu.Item>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      <Drawer.Root open={drawerOpen} onOpenChange={(d) => setDrawerOpen(d.open)} size="md">
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>{editing ? 'Edit banner' : 'New banner'}</Drawer.Title>
                <Drawer.CloseTrigger />
              </Drawer.Header>

              <Drawer.Body>
                <Stack gap={4}>
                  <Field.Root required>
                    <Field.Label>Banner image</Field.Label>
                    <Stack gap={2} width="100%">
                      {previewSrc && (
                        <Image
                          src={previewSrc}
                          alt="Banner preview"
                          width="100%"
                          maxH="180px"
                          objectFit="contain"
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor="gray.200"
                          bg="gray.50"
                        />
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        onChange={handleFileSelected}
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        alignSelf="flex-start"
                      >
                        <FiUpload style={{ marginRight: 8 }} />
                        {imageFile || imageUrl ? 'Replace image' : 'Upload image'}
                      </Button>
                    </Stack>
                    <Field.HelperText>
                      JPG, PNG or WEBP, up to 2MB. A wide image (about 3:1) fits the slots best.
                    </Field.HelperText>
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>Title</Field.Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Spring hiring campaign"
                    />
                    <Field.HelperText>Only you see this — it names the banner in this list.</Field.HelperText>
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>Link</Field.Label>
                    <Input
                      value={form.linkUrl}
                      onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                      placeholder="https://example.com/offer"
                    />
                    <Field.HelperText>Opens in a new tab when a visitor clicks the banner.</Field.HelperText>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Image description</Field.Label>
                    <Input
                      value={form.altText}
                      onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))}
                      placeholder="20% off veterinary supplies"
                    />
                    <Field.HelperText>
                      Read aloud by screen readers and shown if the image fails to load.
                    </Field.HelperText>
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>Where it shows</Field.Label>
                    <Stack gap={2} width="100%">
                      {placements.data?.map((placement) => (
                        <Checkbox.Root
                          key={placement.key}
                          checked={form.placements.includes(placement.key)}
                          onCheckedChange={(d) => togglePlacement(placement.key, Boolean(d.checked))}
                          alignItems="start"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Box>
                            <Checkbox.Label>{placement.label}</Checkbox.Label>
                            <Text fontSize="xs" color="gray.500">{placement.description}</Text>
                          </Box>
                        </Checkbox.Root>
                      ))}
                    </Stack>
                    <Field.HelperText>
                      Pick as many as you like — the same banner can run in several slots.
                    </Field.HelperText>
                  </Field.Root>

                  <HStack gap={3} align="start">
                    <Field.Root>
                      <Field.Label>Starts on</Field.Label>
                      <Input
                        type="date"
                        value={form.startsAt}
                        onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Ends on</Field.Label>
                      <Input
                        type="date"
                        value={form.endsAt}
                        onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                      />
                    </Field.Root>
                  </HStack>
                  <Text fontSize="xs" color="gray.500" mt={-2}>
                    Leave the dates empty to run the banner until you turn it off.
                  </Text>

                  <Field.Root>
                    <Field.Label>Order</Field.Label>
                    <Input
                      type="number"
                      min={0}
                      maxW="140px"
                      value={form.sortOrder}
                      onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    />
                    <Field.HelperText>
                      When several banners share a slot, the lowest number shows first.
                    </Field.HelperText>
                  </Field.Root>

                  <Field.Root>
                    <Switch.Root
                      checked={form.isActive}
                      onCheckedChange={(d) => setForm((f) => ({ ...f, isActive: d.checked }))}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                      <Switch.Label>Live on the website</Switch.Label>
                    </Switch.Root>
                  </Field.Root>
                </Stack>
              </Drawer.Body>

              <Drawer.Footer>
                <Button variant="outline" onClick={() => setDrawerOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button colorPalette="brand" onClick={handleSave} loading={saving}>
                  {editing ? 'Save changes' : 'Create banner'}
                </Button>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title="Delete banner"
        description={`Delete “${deleteTarget?.title ?? 'this banner'}”? It disappears from every slot it runs in, and the uploaded image is removed.`}
        loading={deleteBanner.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteBanner.mutate(deleteTarget._id, {
            onSuccess: () => {
              toaster.create({ title: 'Banner deleted', type: 'success' });
              setDeleteTarget(null);
            },
            onError: (err) =>
              toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
          });
        }}
      />
    </Box>
  );
}
