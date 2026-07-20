import { createFilterOptions } from '@mui/material';
import { City } from 'country-state-city';

export const indiaCityOptions = Array.from(
  new Set((City.getCitiesOfCountry('IN') ?? []).map((city) => city.name.trim())),
).sort((a, b) => a.localeCompare(b));

export const filterCityOptions = createFilterOptions<string>({ limit: 100, trim: true });
