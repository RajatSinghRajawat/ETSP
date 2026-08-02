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
import {
  useSiteContent,
  useTranslateSiteContent,
  useUpdateSiteContent,
  type SiteContentLang,
  type SiteJobProfileItem,
  type SiteLegalPage,
  type SiteLegalSection,
  type SiteLocaleContent,
} from '../hooks/useAdmin';
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

function emptyLegal(): SiteLegalPage {
  return {
    heroTitle: '',
    heroSubtitle: '',
    lastUpdated: '',
    intro: '',
    sections: [],
    contactCardTitle: '',
    contactCardBody: '',
  };
}

function LegalEditor({
  value,
  onChange,
  onSave,
  saving,
  label,
}: {
  value: SiteLegalPage;
  onChange: (next: SiteLegalPage) => void;
  onSave: () => void;
  saving: boolean;
  label: string;
}) {
  function updateSection(index: number, patch: Partial<SiteLegalSection>) {
    onChange({
      ...value,
      sections: value.sections.map((section, i) => (i === index ? { ...section, ...patch } : section)),
    });
  }

  return (
    <Stack gap={5}>
      <SectionCard title={`${label} — Header`} description="Banner and intro shown at the top of the page.">
        <Stack gap={4}>
          <Field.Root>
            <Field.Label>Title</Field.Label>
            <Input
              value={value.heroTitle}
              onChange={(e) => onChange({ ...value, heroTitle: e.target.value })}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Subtitle</Field.Label>
            <Textarea
              value={value.heroSubtitle}
              onChange={(e) => onChange({ ...value, heroSubtitle: e.target.value })}
              rows={2}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Last updated</Field.Label>
            <Input
              value={value.lastUpdated}
              onChange={(e) => onChange({ ...value, lastUpdated: e.target.value })}
              placeholder="1 August 2026"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Intro paragraph</Field.Label>
            <Textarea
              value={value.intro}
              onChange={(e) => onChange({ ...value, intro: e.target.value })}
              rows={4}
            />
          </Field.Root>
        </Stack>
      </SectionCard>

      <SectionCard title="Sections" description="Each section is a titled card with bullet points (one per line).">
        <Stack gap={4}>
          {value.sections.map((section, index) => (
            <Box key={section.id || index} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
              <HStack justify="space-between" mb={3}>
                <Text fontWeight="semibold" fontSize="sm">Section {index + 1}</Text>
                <IconButton
                  aria-label="Remove section"
                  size="sm"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() =>
                    onChange({
                      ...value,
                      sections: value.sections.filter((_, i) => i !== index),
                    })
                  }
                >
                  <FiTrash2 />
                </IconButton>
              </HStack>
              <Stack gap={3}>
                <Field.Root>
                  <Field.Label>Title</Field.Label>
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection(index, { title: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Bullets (one per line)</Field.Label>
                  <Textarea
                    value={(section.body ?? []).join('\n')}
                    onChange={(e) =>
                      updateSection(index, {
                        body: e.target.value
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean),
                      })
                    }
                    rows={5}
                  />
                </Field.Root>
              </Stack>
            </Box>
          ))}

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...value,
                sections: [
                  ...value.sections,
                  {
                    id: `section-${Date.now()}`,
                    title: 'New section',
                    body: ['Add a bullet point'],
                  },
                ],
              })
            }
          >
            <FiPlus style={{ marginRight: 6 }} /> Add section
          </Button>
        </Stack>
      </SectionCard>

      <SectionCard title="Bottom contact card" description="Optional help card at the end of the page.">
        <Stack gap={4}>
          <Field.Root>
            <Field.Label>Card title</Field.Label>
            <Input
              value={value.contactCardTitle}
              onChange={(e) => onChange({ ...value, contactCardTitle: e.target.value })}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Card body</Field.Label>
            <Textarea
              value={value.contactCardBody}
              onChange={(e) => onChange({ ...value, contactCardBody: e.target.value })}
              rows={3}
            />
          </Field.Root>
        </Stack>
      </SectionCard>

      <Box>
        <Button colorPalette="teal" loading={saving} onClick={onSave}>
          Save {label}
        </Button>
      </Box>
    </Stack>
  );
}

export default function SiteContentPage() {
  const { data, isLoading, error } = useSiteContent();
  const updateContent = useUpdateSiteContent();
  const translateContent = useTranslateSiteContent();
  const [lang, setLang] = useState<SiteContentLang>('en');

  const [contact, setContact] = useState<SiteLocaleContent['contact']>({
    email: '',
    phone: '',
    address: '',
    workingHours: '',
    heroTitle: '',
    heroSubtitle: '',
    formTitle: '',
    formSubmitLabel: '',
  });
  const [social, setSocial] = useState({
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: '',
  });
  const [about, setAbout] = useState<SiteLocaleContent['about']>({
    heroOverline: '',
    heroTitle: '',
    heroSubtitle: '',
    primaryCtaLabel: '',
    primaryCtaPath: '',
    secondaryCtaLabel: '',
    secondaryCtaPath: '',
    missionTitle: '',
    missionBody: [],
    missionImageUrl: '',
    storyTitle: '',
    storyBody: '',
    stats: [],
    valuesTitle: '',
    valuesSubtitle: '',
    values: [],
    journeyTitle: '',
    journeySubtitle: '',
    milestones: [],
    teamTitle: '',
    teamSubtitle: '',
    team: [],
    ctaTitle: '',
    ctaSubtitle: '',
    ctaPrimaryLabel: '',
    ctaPrimaryPath: '',
    ctaSecondaryLabel: '',
    ctaSecondaryPath: '',
  });
  const [hero, setHero] = useState<SiteLocaleContent['hero']>({
    badge: '',
    headlinePrefix: '',
    headlineAccent: '',
    headlineSuffix: '',
    subtitle: '',
    searchKeywordPlaceholder: '',
    searchLocationPlaceholder: '',
    searchButtonLabel: '',
    trustLine: '',
    hiringPrompt: '',
    hiringCtaLabel: '',
    hiringCtaPath: '',
    floatingBadge1Title: '',
    floatingBadge1Subtitle: '',
    floatingBadge2Title: '',
    floatingBadge2Subtitle: '',
  });
  const [jobProfiles, setJobProfiles] = useState<SiteLocaleContent['jobProfiles']>({
    title: '',
    subtitle: '',
    exploreLabel: '',
    items: [],
  });
  const [privacy, setPrivacy] = useState<SiteLegalPage>(emptyLegal());
  const [terms, setTerms] = useState<SiteLegalPage>(emptyLegal());
  const [cookies, setCookies] = useState<SiteLegalPage>(emptyLegal());

  useEffect(() => {
    if (!data) return;
    const locale = data[lang] ?? data.en;
    setSocial(data.social);
    setContact(locale.contact);
    setAbout(locale.about);
    setHero(locale.hero);
    setJobProfiles(locale.jobProfiles);
    setPrivacy(locale.privacy);
    setTerms(locale.terms);
    setCookies(locale.cookies);
  }, [data, lang]);

  function save(section: Record<string, unknown>, label: string) {
    const body =
      'social' in section && Object.keys(section).length === 1
        ? section
        : { lang, ...section };

    updateContent.mutate(body, {
      onSuccess: () =>
        toaster.create({ title: `${label} saved (${lang.toUpperCase()})`, type: 'success' }),
      onError: (err) =>
        toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  function translateToHindi() {
    translateContent.mutate(
      {},
      {
        onSuccess: () => {
          setLang('hi');
          toaster.create({
            title: 'Translated to Hindi',
            description: 'English copy was translated with OpenAI and saved under Hindi.',
            type: 'success',
          });
        },
        onError: (err) =>
          toaster.create({
            title: 'Translate failed',
            description: extractErrorMessage(err),
            type: 'error',
          }),
      },
    );
  }

  function updateStat(index: number, patch: Partial<Stat>) {
    setAbout((prev) => ({
      ...prev,
      stats: prev.stats.map((stat, i) => (i === index ? { ...stat, ...patch } : stat)),
    }));
  }

  function updateProfileItem(index: number, patch: Partial<SiteJobProfileItem>) {
    setJobProfiles((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
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
    <Box maxW="960px">
      <PageHeader
        title="Site Content"
        description="Edit English and Hindi copy for homepage, contact, about and legal pages. Use Translate to fill Hindi from English via OpenAI."
      />

      <Flex
        mb={5}
        gap={3}
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        flexWrap="wrap"
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p={4}
      >
        <Box>
          <Text fontWeight="semibold">Editing language</Text>
          <Text fontSize="sm" color="gray.500">
            Social links are shared. All other tabs save to the selected language.
          </Text>
        </Box>
        <HStack gap={2} flexWrap="wrap">
          <Button
            size="sm"
            variant={lang === 'en' ? 'solid' : 'outline'}
            colorPalette="teal"
            onClick={() => setLang('en')}
          >
            English
          </Button>
          <Button
            size="sm"
            variant={lang === 'hi' ? 'solid' : 'outline'}
            colorPalette="teal"
            onClick={() => setLang('hi')}
          >
            हिन्दी
          </Button>
          <Button
            size="sm"
            colorPalette="purple"
            loading={translateContent.isPending}
            onClick={translateToHindi}
          >
            Translate EN → HI (OpenAI)
          </Button>
        </HStack>
      </Flex>

      <Tabs.Root defaultValue="hero" variant="enclosed">
        <Tabs.List mb={5} flexWrap="wrap">
          <Tabs.Trigger value="hero">Hero</Tabs.Trigger>
          <Tabs.Trigger value="jobProfiles">Job Profiles</Tabs.Trigger>
          <Tabs.Trigger value="contact">Contact</Tabs.Trigger>
          <Tabs.Trigger value="social">Social</Tabs.Trigger>
          <Tabs.Trigger value="about">About</Tabs.Trigger>
          <Tabs.Trigger value="privacy">Privacy</Tabs.Trigger>
          <Tabs.Trigger value="terms">Terms</Tabs.Trigger>
          <Tabs.Trigger value="cookies">Cookies</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="hero">
          <SectionCard
            title="Homepage Hero"
            description="The main banner on the home page — badge, headline, search placeholders and CTAs."
          >
            <Stack gap={4}>
              {(
                [
                  ['badge', 'Badge'],
                  ['headlinePrefix', 'Headline (before accent)'],
                  ['headlineAccent', 'Headline accent word'],
                  ['headlineSuffix', 'Headline (after accent)'],
                  ['subtitle', 'Subtitle'],
                  ['searchKeywordPlaceholder', 'Search keyword placeholder'],
                  ['searchLocationPlaceholder', 'Search location placeholder'],
                  ['searchButtonLabel', 'Search button label'],
                  ['trustLine', 'Trust line'],
                  ['hiringPrompt', 'Hiring prompt'],
                  ['hiringCtaLabel', 'Hiring CTA label'],
                  ['hiringCtaPath', 'Hiring CTA path'],
                  ['floatingBadge1Title', 'Floating badge 1 title'],
                  ['floatingBadge1Subtitle', 'Floating badge 1 subtitle'],
                  ['floatingBadge2Title', 'Floating badge 2 title'],
                  ['floatingBadge2Subtitle', 'Floating badge 2 subtitle'],
                ] as const
              ).map(([key, label]) => (
                <Field.Root key={key}>
                  <Field.Label>{label}</Field.Label>
                  {key === 'subtitle' || key === 'trustLine' ? (
                    <Textarea
                      value={hero[key]}
                      onChange={(e) => setHero({ ...hero, [key]: e.target.value })}
                      rows={2}
                    />
                  ) : (
                    <Input
                      value={hero[key]}
                      onChange={(e) => setHero({ ...hero, [key]: e.target.value })}
                    />
                  )}
                </Field.Root>
              ))}
              <Box>
                <Button
                  colorPalette="teal"
                  loading={updateContent.isPending}
                  onClick={() => save({ hero }, 'Hero')}
                >
                  Save Hero
                </Button>
              </Box>
            </Stack>
          </SectionCard>
        </Tabs.Content>

        <Tabs.Content value="jobProfiles">
          <Stack gap={5}>
            <SectionCard title="Section header" description="Title and subtitle above the job profile cards.">
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Title</Field.Label>
                  <Input
                    value={jobProfiles.title}
                    onChange={(e) => setJobProfiles({ ...jobProfiles, title: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Subtitle</Field.Label>
                  <Textarea
                    value={jobProfiles.subtitle}
                    onChange={(e) => setJobProfiles({ ...jobProfiles, subtitle: e.target.value })}
                    rows={2}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Explore button label</Field.Label>
                  <Input
                    value={jobProfiles.exploreLabel}
                    onChange={(e) => setJobProfiles({ ...jobProfiles, exploreLabel: e.target.value })}
                  />
                </Field.Root>
              </Stack>
            </SectionCard>

            <SectionCard
              title="Profile cards"
              description="Each card links to Find Jobs with the search query. Icon keys: MedicalServices, Healing, Hotel, Pets, ContentCut, SupportAgent, BusinessCenter, TrendingUp, Inventory."
            >
              <Stack gap={4}>
                {jobProfiles.items.map((item, index) => (
                  <Box key={item.id || index} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="semibold" fontSize="sm">{item.title || `Profile ${index + 1}`}</Text>
                      <IconButton
                        aria-label="Remove"
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() =>
                          setJobProfiles({
                            ...jobProfiles,
                            items: jobProfiles.items.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <FiTrash2 />
                      </IconButton>
                    </HStack>
                    <Stack gap={3}>
                      <HStack gap={3} align="flex-start" flexWrap="wrap">
                        <Field.Root flex="1" minW="160px">
                          <Field.Label>Title</Field.Label>
                          <Input
                            value={item.title}
                            onChange={(e) => updateProfileItem(index, { title: e.target.value })}
                          />
                        </Field.Root>
                        <Field.Root flex="1" minW="160px">
                          <Field.Label>Search query</Field.Label>
                          <Input
                            value={item.searchQuery ?? ''}
                            onChange={(e) => updateProfileItem(index, { searchQuery: e.target.value })}
                          />
                        </Field.Root>
                      </HStack>
                      <Field.Root>
                        <Field.Label>Description</Field.Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateProfileItem(index, { description: e.target.value })}
                          rows={2}
                        />
                      </Field.Root>
                      <HStack gap={3} flexWrap="wrap">
                        <Field.Root>
                          <Field.Label>Icon key</Field.Label>
                          <Input
                            value={item.iconKey ?? ''}
                            onChange={(e) => updateProfileItem(index, { iconKey: e.target.value })}
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Color</Field.Label>
                          <Input
                            value={item.color ?? ''}
                            onChange={(e) => updateProfileItem(index, { color: e.target.value })}
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Background</Field.Label>
                          <Input
                            value={item.bgColor ?? ''}
                            onChange={(e) => updateProfileItem(index, { bgColor: e.target.value })}
                          />
                        </Field.Root>
                      </HStack>
                    </Stack>
                  </Box>
                ))}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setJobProfiles({
                      ...jobProfiles,
                      items: [
                        ...jobProfiles.items,
                        {
                          id: `profile-${Date.now()}`,
                          title: 'New role',
                          description: '',
                          searchQuery: '',
                          color: '#0c5283',
                          bgColor: 'rgba(12, 82, 131, 0.08)',
                          iconKey: 'MedicalServices',
                        },
                      ],
                    })
                  }
                >
                  <FiPlus style={{ marginRight: 6 }} /> Add profile
                </Button>
              </Stack>
            </SectionCard>

            <Box>
              <Button
                colorPalette="teal"
                loading={updateContent.isPending}
                onClick={() =>
                  save(
                    {
                      jobProfiles: {
                        ...jobProfiles,
                        items: jobProfiles.items.filter((item) => item.title.trim()),
                      },
                    },
                    'Job Profiles',
                  )
                }
              >
                Save Job Profiles
              </Button>
            </Box>
          </Stack>
        </Tabs.Content>

        <Tabs.Content value="contact">
          <SectionCard
            title="Contact Page"
            description="Banner text plus the info cards on /contact. Clear an info field to hide that card."
          >
            <Stack gap={4}>
              <Field.Root>
                <Field.Label>Banner title</Field.Label>
                <Input
                  value={contact.heroTitle}
                  onChange={(e) => setContact({ ...contact, heroTitle: e.target.value })}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Banner subtitle</Field.Label>
                <Textarea
                  value={contact.heroSubtitle}
                  onChange={(e) => setContact({ ...contact, heroSubtitle: e.target.value })}
                  rows={2}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Form title</Field.Label>
                <Input
                  value={contact.formTitle}
                  onChange={(e) => setContact({ ...contact, formTitle: e.target.value })}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Submit button</Field.Label>
                <Input
                  value={contact.formSubmitLabel}
                  onChange={(e) => setContact({ ...contact, formSubmitLabel: e.target.value })}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Email</Field.Label>
                <Input
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Phone</Field.Label>
                <Input
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Address</Field.Label>
                <Input
                  value={contact.address}
                  onChange={(e) => setContact({ ...contact, address: e.target.value })}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Working Hours</Field.Label>
                <Input
                  value={contact.workingHours}
                  onChange={(e) => setContact({ ...contact, workingHours: e.target.value })}
                />
              </Field.Root>
              <Box>
                <Button
                  colorPalette="teal"
                  loading={updateContent.isPending}
                  onClick={() => save({ contact }, 'Contact')}
                >
                  Save Contact
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
            <SectionCard title="Hero banner" description="Top banner on /about — overline, title, subtitle and CTAs.">
              <Stack gap={4}>
                {(
                  [
                    ['heroOverline', 'Overline'],
                    ['heroTitle', 'Banner heading'],
                    ['heroSubtitle', 'Banner subtitle'],
                    ['primaryCtaLabel', 'Primary CTA label'],
                    ['primaryCtaPath', 'Primary CTA path'],
                    ['secondaryCtaLabel', 'Secondary CTA label'],
                    ['secondaryCtaPath', 'Secondary CTA path'],
                  ] as const
                ).map(([key, label]) => (
                  <Field.Root key={key}>
                    <Field.Label>{label}</Field.Label>
                    {key === 'heroSubtitle' ? (
                      <Textarea
                        value={about[key]}
                        onChange={(e) => setAbout({ ...about, [key]: e.target.value })}
                        rows={2}
                      />
                    ) : (
                      <Input
                        value={about[key]}
                        onChange={(e) => setAbout({ ...about, [key]: e.target.value })}
                      />
                    )}
                  </Field.Root>
                ))}
              </Stack>
            </SectionCard>

            <SectionCard title="Mission" description="Mission heading, paragraphs and side image.">
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Mission title</Field.Label>
                  <Input
                    value={about.missionTitle}
                    onChange={(e) => setAbout({ ...about, missionTitle: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Mission image URL</Field.Label>
                  <Input
                    value={about.missionImageUrl}
                    onChange={(e) => setAbout({ ...about, missionImageUrl: e.target.value })}
                  />
                </Field.Root>
                <Stack gap={3}>
                  <Text fontWeight="semibold" fontSize="sm">Mission paragraphs</Text>
                  {about.missionBody.map((paragraph, index) => (
                    <HStack key={index} align="flex-start" gap={2}>
                      <Textarea
                        value={paragraph}
                        onChange={(e) => {
                          const missionBody = [...about.missionBody];
                          missionBody[index] = e.target.value;
                          setAbout({ ...about, missionBody });
                        }}
                        rows={3}
                      />
                      <IconButton
                        aria-label="Remove paragraph"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() =>
                          setAbout({
                            ...about,
                            missionBody: about.missionBody.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <FiTrash2 />
                      </IconButton>
                    </HStack>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={about.missionBody.length >= 6}
                    onClick={() => setAbout({ ...about, missionBody: [...about.missionBody, ''] })}
                  >
                    <FiPlus style={{ marginRight: 6 }} /> Add paragraph
                  </Button>
                </Stack>
              </Stack>
            </SectionCard>

            <SectionCard title="Story + stats" description="Story heading/body and the number tiles.">
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Story heading</Field.Label>
                  <Input
                    value={about.storyTitle}
                    onChange={(e) => setAbout({ ...about, storyTitle: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Story text</Field.Label>
                  <Textarea
                    value={about.storyBody}
                    onChange={(e) => setAbout({ ...about, storyBody: e.target.value })}
                    rows={4}
                  />
                </Field.Root>
                <Stack gap={3}>
                  <Text fontWeight="semibold" fontSize="sm">Stat tiles</Text>
                  {about.stats.map((stat, index) => (
                    <HStack key={index} gap={3} align="flex-end">
                      <Field.Root>
                        <Field.Label fontSize="xs">Value</Field.Label>
                        <Input
                          value={stat.value}
                          onChange={(e) => updateStat(index, { value: e.target.value })}
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label fontSize="xs">Label</Field.Label>
                        <Input
                          value={stat.label}
                          onChange={(e) => updateStat(index, { label: e.target.value })}
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
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={about.stats.length >= 8}
                    onClick={() => setAbout({ ...about, stats: [...about.stats, { value: '', label: '' }] })}
                  >
                    <FiPlus style={{ marginRight: 6 }} /> Add Stat
                  </Button>
                </Stack>
              </Stack>
            </SectionCard>

            <SectionCard
              title="Values"
              description="Core value cards. Icon keys: Verified, Speed, Pets, Support."
            >
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Section title</Field.Label>
                  <Input
                    value={about.valuesTitle}
                    onChange={(e) => setAbout({ ...about, valuesTitle: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Section subtitle</Field.Label>
                  <Input
                    value={about.valuesSubtitle}
                    onChange={(e) => setAbout({ ...about, valuesSubtitle: e.target.value })}
                  />
                </Field.Root>
                {about.values.map((item, index) => (
                  <Box key={item.id || index} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="semibold" fontSize="sm">{item.title || `Value ${index + 1}`}</Text>
                      <IconButton
                        aria-label="Remove"
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() =>
                          setAbout({ ...about, values: about.values.filter((_, i) => i !== index) })
                        }
                      >
                        <FiTrash2 />
                      </IconButton>
                    </HStack>
                    <Stack gap={3}>
                      <HStack gap={3} flexWrap="wrap">
                        <Field.Root flex="1" minW="140px">
                          <Field.Label>Title</Field.Label>
                          <Input
                            value={item.title}
                            onChange={(e) => {
                              const values = [...about.values];
                              values[index] = { ...item, title: e.target.value };
                              setAbout({ ...about, values });
                            }}
                          />
                        </Field.Root>
                        <Field.Root flex="1" minW="120px">
                          <Field.Label>Icon key</Field.Label>
                          <Input
                            value={item.iconKey ?? ''}
                            onChange={(e) => {
                              const values = [...about.values];
                              values[index] = { ...item, iconKey: e.target.value };
                              setAbout({ ...about, values });
                            }}
                          />
                        </Field.Root>
                      </HStack>
                      <Field.Root>
                        <Field.Label>Description</Field.Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => {
                            const values = [...about.values];
                            values[index] = { ...item, description: e.target.value };
                            setAbout({ ...about, values });
                          }}
                          rows={2}
                        />
                      </Field.Root>
                    </Stack>
                  </Box>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={about.values.length >= 8}
                  onClick={() =>
                    setAbout({
                      ...about,
                      values: [
                        ...about.values,
                        {
                          id: `value-${Date.now()}`,
                          title: '',
                          description: '',
                          iconKey: 'Verified',
                        },
                      ],
                    })
                  }
                >
                  <FiPlus style={{ marginRight: 6 }} /> Add value
                </Button>
              </Stack>
            </SectionCard>

            <SectionCard title="Journey / milestones" description="Timeline cards under Our Journey.">
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Section title</Field.Label>
                  <Input
                    value={about.journeyTitle}
                    onChange={(e) => setAbout({ ...about, journeyTitle: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Section subtitle</Field.Label>
                  <Input
                    value={about.journeySubtitle}
                    onChange={(e) => setAbout({ ...about, journeySubtitle: e.target.value })}
                  />
                </Field.Root>
                {about.milestones.map((item, index) => (
                  <Box key={index} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="semibold" fontSize="sm">{item.year || `Milestone ${index + 1}`}</Text>
                      <IconButton
                        aria-label="Remove"
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() =>
                          setAbout({
                            ...about,
                            milestones: about.milestones.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <FiTrash2 />
                      </IconButton>
                    </HStack>
                    <Stack gap={3}>
                      <HStack gap={3} flexWrap="wrap">
                        <Field.Root>
                          <Field.Label>Year</Field.Label>
                          <Input
                            value={item.year}
                            onChange={(e) => {
                              const milestones = [...about.milestones];
                              milestones[index] = { ...item, year: e.target.value };
                              setAbout({ ...about, milestones });
                            }}
                          />
                        </Field.Root>
                        <Field.Root flex="1" minW="160px">
                          <Field.Label>Title</Field.Label>
                          <Input
                            value={item.title}
                            onChange={(e) => {
                              const milestones = [...about.milestones];
                              milestones[index] = { ...item, title: e.target.value };
                              setAbout({ ...about, milestones });
                            }}
                          />
                        </Field.Root>
                      </HStack>
                      <Field.Root>
                        <Field.Label>Description</Field.Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => {
                            const milestones = [...about.milestones];
                            milestones[index] = { ...item, description: e.target.value };
                            setAbout({ ...about, milestones });
                          }}
                          rows={2}
                        />
                      </Field.Root>
                    </Stack>
                  </Box>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={about.milestones.length >= 12}
                  onClick={() =>
                    setAbout({
                      ...about,
                      milestones: [...about.milestones, { year: '', title: '', description: '' }],
                    })
                  }
                >
                  <FiPlus style={{ marginRight: 6 }} /> Add milestone
                </Button>
              </Stack>
            </SectionCard>

            <SectionCard title="Team" description="Team member cards — name, role, photo URL, experience.">
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Section title</Field.Label>
                  <Input
                    value={about.teamTitle}
                    onChange={(e) => setAbout({ ...about, teamTitle: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Section subtitle</Field.Label>
                  <Textarea
                    value={about.teamSubtitle}
                    onChange={(e) => setAbout({ ...about, teamSubtitle: e.target.value })}
                    rows={2}
                  />
                </Field.Root>
                {about.team.map((member, index) => (
                  <Box key={index} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="semibold" fontSize="sm">{member.name || `Member ${index + 1}`}</Text>
                      <IconButton
                        aria-label="Remove"
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() =>
                          setAbout({ ...about, team: about.team.filter((_, i) => i !== index) })
                        }
                      >
                        <FiTrash2 />
                      </IconButton>
                    </HStack>
                    <Stack gap={3}>
                      <HStack gap={3} flexWrap="wrap">
                        <Field.Root flex="1" minW="140px">
                          <Field.Label>Name</Field.Label>
                          <Input
                            value={member.name}
                            onChange={(e) => {
                              const team = [...about.team];
                              team[index] = { ...member, name: e.target.value };
                              setAbout({ ...about, team });
                            }}
                          />
                        </Field.Root>
                        <Field.Root flex="1" minW="140px">
                          <Field.Label>Role</Field.Label>
                          <Input
                            value={member.role}
                            onChange={(e) => {
                              const team = [...about.team];
                              team[index] = { ...member, role: e.target.value };
                              setAbout({ ...about, team });
                            }}
                          />
                        </Field.Root>
                      </HStack>
                      <Field.Root>
                        <Field.Label>Photo URL</Field.Label>
                        <Input
                          value={member.image ?? ''}
                          onChange={(e) => {
                            const team = [...about.team];
                            team[index] = { ...member, image: e.target.value };
                            setAbout({ ...about, team });
                          }}
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>Experience</Field.Label>
                        <Input
                          value={member.experience ?? ''}
                          onChange={(e) => {
                            const team = [...about.team];
                            team[index] = { ...member, experience: e.target.value };
                            setAbout({ ...about, team });
                          }}
                        />
                      </Field.Root>
                    </Stack>
                  </Box>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={about.team.length >= 12}
                  onClick={() =>
                    setAbout({
                      ...about,
                      team: [...about.team, { name: '', role: '', image: '', experience: '' }],
                    })
                  }
                >
                  <FiPlus style={{ marginRight: 6 }} /> Add team member
                </Button>
              </Stack>
            </SectionCard>

            <SectionCard title="Bottom CTA" description="Final call-to-action band at the bottom of /about.">
              <Stack gap={4}>
                {(
                  [
                    ['ctaTitle', 'Title'],
                    ['ctaSubtitle', 'Subtitle'],
                    ['ctaPrimaryLabel', 'Primary button label'],
                    ['ctaPrimaryPath', 'Primary button path'],
                    ['ctaSecondaryLabel', 'Secondary button label'],
                    ['ctaSecondaryPath', 'Secondary button path'],
                  ] as const
                ).map(([key, label]) => (
                  <Field.Root key={key}>
                    <Field.Label>{label}</Field.Label>
                    {key === 'ctaSubtitle' ? (
                      <Textarea
                        value={about[key]}
                        onChange={(e) => setAbout({ ...about, [key]: e.target.value })}
                        rows={2}
                      />
                    ) : (
                      <Input
                        value={about[key]}
                        onChange={(e) => setAbout({ ...about, [key]: e.target.value })}
                      />
                    )}
                  </Field.Root>
                ))}
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
                        missionBody: about.missionBody.filter((p) => p.trim()),
                        stats: about.stats.filter((stat) => stat.value.trim() && stat.label.trim()),
                        values: about.values.filter((item) => item.title.trim()),
                        milestones: about.milestones.filter(
                          (item) => item.year.trim() && item.title.trim(),
                        ),
                        team: about.team.filter((member) => member.name.trim() && member.role.trim()),
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

        <Tabs.Content value="privacy">
          <LegalEditor
            label="Privacy Policy"
            value={privacy}
            onChange={setPrivacy}
            saving={updateContent.isPending}
            onSave={() => save({ privacy }, 'Privacy Policy')}
          />
        </Tabs.Content>

        <Tabs.Content value="terms">
          <LegalEditor
            label="Terms of Service"
            value={terms}
            onChange={setTerms}
            saving={updateContent.isPending}
            onSave={() => save({ terms }, 'Terms of Service')}
          />
        </Tabs.Content>

        <Tabs.Content value="cookies">
          <LegalEditor
            label="Cookie Policy"
            value={cookies}
            onChange={setCookies}
            saving={updateContent.isPending}
            onSave={() => save({ cookies }, 'Cookie Policy')}
          />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
