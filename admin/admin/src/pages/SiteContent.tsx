import {
  Box,
  Button,
  Field,
  Flex,
  HStack,
  IconButton,
  Input,
  Spinner,
  Stack,
  Tabs,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { PageHeader } from '../components/PageHeader';
import { toaster } from '../components/Toaster';
import { useSiteContent, useUpdateSiteContent, type SiteContent } from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';

type Stat = { value: string; label: string };

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={6}>
      <Text fontWeight="bold" fontSize="lg">{title}</Text>
      <Text fontSize="sm" color="gray.500" mb={4}>{description}</Text>
      {children}
    </Box>
  );
}

export default function SiteContentPage() {
  const { data, isLoading, error } = useSiteContent();
  const updateContent = useUpdateSiteContent();

  const [contact, setContact] = useState<SiteContent['contact']>({
    email: '',
    phone: '',
    address: '',
    workingHours: '',
  });
  const [social, setSocial] = useState<SiteContent['social']>({
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: '',
  });
  const [about, setAbout] = useState<SiteContent['about']>({
    heroTitle: '',
    heroSubtitle: '',
    storyTitle: '',
    storyBody: '',
    stats: [],
  });

  // Seed the form once the saved content arrives.
  useEffect(() => {
    if (!data) return;
    setContact(data.contact);
    setSocial(data.social);
    setAbout(data.about);
  }, [data]);

  function save(section: Partial<SiteContent>, label: string) {
    updateContent.mutate(section, {
      onSuccess: () => toaster.create({ title: `${label} saved`, type: 'success' }),
      onError: (err) =>
        toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  function updateStat(index: number, patch: Partial<Stat>) {
    setAbout((prev) => ({
      ...prev,
      stats: prev.stats.map((stat, i) => (i === index ? { ...stat, ...patch } : stat)),
    }));
  }

  if (isLoading) {
    return (
      <Flex py={16} justify="center">
        <Spinner />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Text color="red.600">{extractErrorMessage(error)}</Text>
      </Box>
    );
  }

  return (
    <Box maxW="860px">
      <PageHeader
        title="Site Content"
        description="Contact details, social links and About page text shown on the public website."
      />

      <Tabs.Root defaultValue="contact" variant="enclosed">
        <Tabs.List mb={5}>
          <Tabs.Trigger value="contact">Contact</Tabs.Trigger>
          <Tabs.Trigger value="social">Social Links</Tabs.Trigger>
          <Tabs.Trigger value="about">About Us</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="contact">
          <SectionCard
            title="Contact Details"
            description="Shown on the Contact page. Clear a field to hide that card entirely."
          >
            <Stack gap={4}>
              <Field.Root>
                <Field.Label>Email</Field.Label>
                <Input
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  placeholder="support@vetjobs.com"
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Phone</Field.Label>
                <Input
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Address</Field.Label>
                <Input
                  value={contact.address}
                  onChange={(e) => setContact({ ...contact, address: e.target.value })}
                  placeholder="Mumbai, Maharashtra, India"
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Working Hours</Field.Label>
                <Input
                  value={contact.workingHours}
                  onChange={(e) => setContact({ ...contact, workingHours: e.target.value })}
                  placeholder="Mon - Sat, 9:00 AM - 6:00 PM"
                />
              </Field.Root>
              <Box>
                <Button
                  colorPalette="teal"
                  loading={updateContent.isPending}
                  onClick={() => save({ contact }, 'Contact details')}
                >
                  Save Contact Details
                </Button>
              </Box>
            </Stack>
          </SectionCard>
        </Tabs.Content>

        <Tabs.Content value="social">
          <SectionCard
            title="Social Links"
            description="Shown as icons in the website footer. Leave one blank to hide that icon."
          >
            <Stack gap={4}>
              {(['facebook', 'twitter', 'linkedin', 'instagram'] as const).map((key) => (
                <Field.Root key={key}>
                  <Field.Label textTransform="capitalize">{key}</Field.Label>
                  <Input
                    value={social[key]}
                    onChange={(e) => setSocial({ ...social, [key]: e.target.value })}
                    placeholder={`https://${key}.com/yourpage`}
                  />
                </Field.Root>
              ))}
              <Text fontSize="xs" color="gray.500">
                Enter the full URL including https://
              </Text>
              <Box>
                <Button
                  colorPalette="teal"
                  loading={updateContent.isPending}
                  onClick={() => save({ social }, 'Social links')}
                >
                  Save Social Links
                </Button>
              </Box>
            </Stack>
          </SectionCard>
        </Tabs.Content>

        <Tabs.Content value="about">
          <Stack gap={5}>
            <SectionCard title="About Page Text" description="The banner and story text on the About page.">
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Banner Heading</Field.Label>
                  <Input
                    value={about.heroTitle}
                    onChange={(e) => setAbout({ ...about, heroTitle: e.target.value })}
                    placeholder="Revolutionizing Veterinary Hiring"
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Banner Subtitle</Field.Label>
                  <Textarea
                    value={about.heroSubtitle}
                    onChange={(e) => setAbout({ ...about, heroSubtitle: e.target.value })}
                    rows={2}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Story Heading</Field.Label>
                  <Input
                    value={about.storyTitle}
                    onChange={(e) => setAbout({ ...about, storyTitle: e.target.value })}
                    placeholder="Our Impact"
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Story Text</Field.Label>
                  <Textarea
                    value={about.storyBody}
                    onChange={(e) => setAbout({ ...about, storyBody: e.target.value })}
                    rows={4}
                  />
                </Field.Root>
              </Stack>
            </SectionCard>

            <SectionCard title="Stat Tiles" description="The numbers shown under the story heading.">
              <Stack gap={3}>
                {about.stats.map((stat, index) => (
                  <HStack key={index} gap={3} align="flex-end">
                    <Field.Root>
                      <Field.Label fontSize="xs">Value</Field.Label>
                      <Input
                        value={stat.value}
                        onChange={(e) => updateStat(index, { value: e.target.value })}
                        placeholder="10,000+"
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label fontSize="xs">Label</Field.Label>
                      <Input
                        value={stat.label}
                        onChange={(e) => updateStat(index, { label: e.target.value })}
                        placeholder="Active Professionals"
                      />
                    </Field.Root>
                    <IconButton
                      aria-label="Remove stat"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() =>
                        setAbout({ ...about, stats: about.stats.filter((_, i) => i !== index) })
                      }
                    >
                      <FiTrash2 />
                    </IconButton>
                  </HStack>
                ))}

                {about.stats.length === 0 && (
                  <Text fontSize="sm" color="gray.500">
                    No stat tiles — the About page will skip that row.
                  </Text>
                )}

                <Box>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={about.stats.length >= 8}
                    onClick={() => setAbout({ ...about, stats: [...about.stats, { value: '', label: '' }] })}
                  >
                    <FiPlus style={{ marginRight: 6 }} /> Add Stat
                  </Button>
                </Box>
              </Stack>
            </SectionCard>

            <Box>
              <Button
                colorPalette="teal"
                loading={updateContent.isPending}
                onClick={() =>
                  save(
                    {
                      about: {
                        ...about,
                        // An incomplete row would render as a blank tile.
                        stats: about.stats.filter((stat) => stat.value.trim() && stat.label.trim()),
                      },
                    },
                    'About page',
                  )
                }
              >
                Save About Page
              </Button>
            </Box>
          </Stack>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
