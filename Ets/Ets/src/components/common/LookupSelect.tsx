import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  useGetLookupsQuery,
  useProposeLookupMutation,
  type LookupCategory,
} from '../../store/api/lookupApi';

const ADD_NEW = '__add_new__';

type LookupSelectProps = {
  category: LookupCategory;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Store `name` (display) instead of `value` — useful when forms already persist display strings. */
  valueMode?: 'value' | 'name';
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  helperText?: string;
  allowPropose?: boolean;
  emptyLabel?: string;
};

/**
 * Select fed by admin-managed lookup options, with an "Add new…" entry that
 * submits a proposal for admin approval (does not publish immediately).
 */
export default function LookupSelect({
  category,
  label,
  value,
  onChange,
  valueMode = 'value',
  required = false,
  disabled = false,
  fullWidth = true,
  size = 'medium',
  helperText,
  allowPropose = true,
  emptyLabel = 'Select…',
}: LookupSelectProps) {
  const isLoggedIn = Boolean(localStorage.getItem('ets-access-token'));
  const { data, isLoading } = useGetLookupsQuery({ category });
  const [propose, { isLoading: proposing }] = useProposeLookupMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const options = useMemo(() => data?.data ?? [], [data]);

  const optionKey = (item: { name: string; value: string }) =>
    valueMode === 'name' ? item.name : item.value;

  const handleSelect = (event: SelectChangeEvent<string>) => {
    const next = event.target.value;
    if (next === ADD_NEW) {
      setFeedback(null);
      setNewName('');
      setDialogOpen(true);
      return;
    }
    onChange(next);
  };

  const handlePropose = async () => {
    const name = newName.trim();
    if (name.length < 2) {
      setFeedback({ type: 'error', text: 'Enter at least 2 characters.' });
      return;
    }
    if (!isLoggedIn) {
      setFeedback({ type: 'error', text: 'Please log in to suggest a new option.' });
      return;
    }

    try {
      const res = await propose({ category, name }).unwrap();
      setFeedback({ type: 'success', text: res.message || 'Submitted for admin approval.' });
      // If it was already approved, select it immediately.
      if (res.data?.status === 'approved' && res.data.isActive !== false) {
        onChange(optionKey(res.data));
        setDialogOpen(false);
      }
    } catch (err) {
      const apiError = err as { data?: { message?: string } };
      setFeedback({
        type: 'error',
        text: apiError?.data?.message ?? 'Could not submit. Please try again.',
      });
    }
  };

  return (
    <>
      <FormControl fullWidth={fullWidth} required={required} disabled={disabled || isLoading} size={size}>
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={value || ''}
          onChange={handleSelect}
          renderValue={(selected) => {
            if (!selected) return emptyLabel;
            const match = options.find((o) => optionKey(o) === selected);
            return match?.name ?? selected;
          }}
        >
          <MenuItem value="">
            <em>{emptyLabel}</em>
          </MenuItem>
          {isLoading && (
            <MenuItem disabled value="__loading__">
              <CircularProgress size={16} sx={{ mr: 1 }} /> Loading…
            </MenuItem>
          )}
          {options.map((opt) => (
            <MenuItem key={opt._id} value={optionKey(opt)}>
              {opt.name}
            </MenuItem>
          ))}
          {allowPropose && (
            <MenuItem value={ADD_NEW} sx={{ color: 'primary.main', fontWeight: 600 }}>
              <AddIcon fontSize="small" sx={{ mr: 1 }} />
              Add new…
            </MenuItem>
          )}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Suggest a new {label.toLowerCase()}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your suggestion is sent to the admin for approval. It will appear in this list only after
            it is approved.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="New value"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={proposing}
          />
          {feedback && (
            <Alert severity={feedback.type} sx={{ mt: 2 }}>
              {feedback.text}
            </Alert>
          )}
          {!isLoggedIn && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Log in to submit a suggestion.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={proposing}>
            Close
          </Button>
          <Button variant="contained" onClick={handlePropose} disabled={proposing || !isLoggedIn}>
            {proposing ? 'Submitting…' : 'Submit for approval'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** Chip-picker style multi-select for skills / benefits / specialties. */
export function LookupChipPicker({
  category,
  label,
  values,
  onChange,
  allowPropose = true,
}: {
  category: LookupCategory;
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  allowPropose?: boolean;
}) {
  const { data, isLoading } = useGetLookupsQuery({ category });
  const options = data?.data ?? [];
  const [pick, setPick] = useState('');

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {label}
      </Typography>
      <LookupSelect
        category={category}
        label={`Add ${label.toLowerCase()}`}
        value={pick}
        size="small"
        allowPropose={allowPropose}
        valueMode="name"
        onChange={(v) => {
          if (!v) return;
          if (!values.includes(v)) onChange([...values, v]);
          setPick('');
        }}
        emptyLabel={isLoading ? 'Loading…' : `Choose ${label.toLowerCase()}…`}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        {values.map((v) => (
          <Button
            key={v}
            size="small"
            variant="outlined"
            onClick={() => onChange(values.filter((x) => x !== v))}
            sx={{ textTransform: 'none' }}
          >
            {v} ×
          </Button>
        ))}
        {!values.length && (
          <Typography variant="caption" color="text.secondary">
            No {label.toLowerCase()} selected yet.
            {options.length ? ` ${options.length} options available.` : ''}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
