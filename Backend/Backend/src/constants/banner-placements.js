/**
 * Every slot on the public site that can show an advertisement banner. The
 * website renders one <AdBanner placement="..."/> per entry here, so adding a
 * slot means adding it in this list and mounting the component on that page.
 *
 * Keep the keys stable — they are stored on banner records in the database.
 */
export const BANNER_PLACEMENTS = [
  {
    key: 'global_top',
    label: 'Site-wide — below the header',
    description: 'Appears on every page, directly under the navigation bar.',
  },
  {
    key: 'home_top',
    label: 'Home — below the hero slider',
    description: 'First slot on the home page, under the main carousel.',
  },
  {
    key: 'home_mid',
    label: 'Home — between Featured Jobs and Candidates',
    description: 'Middle of the home page, where visitors are already scrolling.',
  },
  {
    key: 'home_bottom',
    label: 'Home — above the closing call to action',
    description: 'Near the end of the home page, before the sign-up section.',
  },
  {
    key: 'jobs_list',
    label: 'Job search — above the results',
    description: 'On the job listing page, between the filters and the results.',
  },
  {
    key: 'job_detail',
    label: 'Job details — below the job description',
    description: 'On a single job page, under the description block.',
  },
];

export const BANNER_PLACEMENT_KEYS = BANNER_PLACEMENTS.map((placement) => placement.key);

export const isBannerPlacement = (value) => BANNER_PLACEMENT_KEYS.includes(value);
