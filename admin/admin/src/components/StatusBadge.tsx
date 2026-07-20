import { Badge } from '@chakra-ui/react';

const PALETTE: Record<string, string> = {
  active: 'green',
  hired: 'green',
  shortlisted: 'green',
  submitted: 'blue',
  reviewing: 'blue',
  draft: 'gray',
  closed: 'gray',
  new: 'purple',
  imported: 'purple',
  registered: 'green',
  rejected: 'red',
  inactive: 'red',
  admin: 'purple',
  candidate: 'blue',
  employer: 'orange',
  past_due: 'orange',
  canceled: 'red',
  incomplete: 'gray',
  pending: 'orange',
  paid: 'green',
  expired: 'gray',
  failed: 'red',
};

export function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return null;
  const key = value.toLowerCase();
  const color = PALETTE[key] ?? 'gray';
  return (
    <Badge colorPalette={color} variant="subtle" textTransform="capitalize">
      {value}
    </Badge>
  );
}
