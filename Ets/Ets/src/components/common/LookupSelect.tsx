import { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
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
  type LookupItem,
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
  error?: boolean;
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
  error = false,
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

  const valueInOptions = Boolean(value && options.some((o) => optionKey(o) === value));

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
      <FormControl
        fullWidth={fullWidth}
        required={required}
        disabled={disabled || isLoading}
        size={size}
        error={error}
      >
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
          {/* Keep current value selectable when editing a legacy/custom entry. */}
          {value && !valueInOptions && (
            <MenuItem value={value}>{value}</MenuItem>
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

/** Multi-select fed by admin lookups, with removable chips and "Add new…" propose. */
export function LookupChipPicker({
  category,
  label,
  values,
  onChange,
  allowPropose = true,
  valueMode = 'name',
  helperText,
  error = false,
  required = false,
  placeholder,
}: {
  category: LookupCategory;
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  allowPropose?: boolean;
  valueMode?: 'value' | 'name';
  helperText?: string;
  error?: boolean;
  required?: boolean;
  placeholder?: string;
}) {
  const isLoggedIn = Boolean(localStorage.getItem('ets-access-token'));
  const { data, isLoading } = useGetLookupsQuery({ category });
  const [propose, { isLoading: proposing }] = useProposeLookupMutation();
  const options = data?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedOptions = useMemo((): LookupItem[] => {
    return values.map((selected) => {
      const match = options.find(
        (o) =>
          (valueMode === 'name' ? o.name : o.value) === selected ||
          o.name === selected ||
          o.value === selected,
      );
      return (
        match ?? {
          _id: `custom-${selected}`,
          name: selected,
          value: selected,
          order: 0,
          isActive: true,
        }
      );
    });
  }, [values, options, valueMode]);

  const getKey = (item: { name: string; value: string }) =>
    valueMode === 'name' ? item.name : item.value;

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
      if (res.data?.status === 'approved' && res.data.isActive !== false) {
        const key = valueMode === 'name' ? res.data.name : res.data.value;
        if (!values.includes(key)) onChange([...values, key]);
        setDialogOpen(false);
        setNewName('');
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
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {label}
          {required ? ' *' : ''}
        </Typography>
        <Chip
          size="small"
          label={`${values.length} selected`}
          sx={{
            fontWeight: 700,
            bgcolor: values.length ? 'rgba(10,182,162,0.12)' : 'action.hover',
            color: values.length ? '#0ab6a2' : 'text.secondary',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <Autocomplete
          multiple
          fullWidth
          disableCloseOnSelect
          loading={isLoading}
          options={options}
          value={selectedOptions}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, val) =>
            getKey(option) === getKey(val) || option.name === val.name || option.value === val.value
          }
          onChange={(_event, next) => {
            const keys = next.map((item) => getKey(item));
            onChange([...new Set(keys)]);
          }}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option.name}
                  size="small"
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                  {...tagProps}
                />
              );
            })
          }
          renderOption={(props, option, { selected }) => (
            <li {...props} key={option._id}>
              <Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
              {option.name}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={`Select ${label.toLowerCase()}`}
              placeholder={
                values.length
                  ? ''
                  : placeholder || (isLoading ? 'Loading…' : `Choose one or more ${label.toLowerCase()}`)
              }
              error={error}
              helperText={helperText}
            />
          )}
        />
        {allowPropose && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              setFeedback(null);
              setNewName('');
              setDialogOpen(true);
            }}
            sx={{
              flexShrink: 0,
              height: 56,
              px: 2,
              textTransform: 'none',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            Add new
          </Button>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Suggest a new {label.toLowerCase().replace(/s$/, '')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your suggestion goes to the admin for approval. It appears in this list only after it is
            approved.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="New value"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={proposing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handlePropose();
              }
            }}
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
    </Box>
  );
}
