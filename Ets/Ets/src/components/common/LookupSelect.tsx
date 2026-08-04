import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import {
  useGetLookupsQuery,
  useProposeLookupMutation,
  type LookupCategory,
  type LookupItem,
} from '../../store/api/lookupApi';
import notify from '../../utils/toast';

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
 * Select fed by the shared lookup catalogue. Missing values can be added inline
 * from the bottom of the dropdown — no dialog, no sign-in — and become
 * immediately selectable.
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
  const { data, isLoading } = useGetLookupsQuery({ category });
  const [propose, { isLoading: proposing }] = useProposeLookupMutation();
  const [newName, setNewName] = useState('');

  const options = useMemo(() => data?.data ?? [], [data]);

  const optionKey = (item: { name: string; value: string }) =>
    valueMode === 'name' ? item.name : item.value;

  const valueInOptions = Boolean(value && options.some((o) => optionKey(o) === value));

  const handleSelect = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (name.length < 2) {
      notify.warning('Enter at least 2 characters.');
      return;
    }

    try {
      const res = await propose({ category, name }).unwrap();
      const created = res.data;
      if (created) {
        onChange(optionKey(created));
        notify.success(res.message || `"${created.name}" added.`);
      }
      setNewName('');
    } catch (err) {
      notify.apiError(err, `Could not add "${name}".`);
    }
  };

  return (
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
        // Keeps the menu open while the inline "add" field is being typed into.
        MenuProps={{ autoFocus: false, slotProps: { paper: { sx: { maxHeight: 360 } } } }}
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
        {value && !valueInOptions && <MenuItem value={value}>{value}</MenuItem>}
        {options.map((opt) => (
          <MenuItem key={opt._id} value={optionKey(opt)}>
            {opt.name}
          </MenuItem>
        ))}

        {allowPropose && <Divider sx={{ my: 0.5 }} />}
        {allowPropose && (
          // Not a real option — a text field living in the menu. All keyboard and
          // pointer events are stopped so MUI's Select never treats them as a
          // selection or type-ahead.
          <Box
            sx={{ px: 1.5, py: 1 }}
            onKeyDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Not in the list? Add it
            </Typography>
            <TextField
              fullWidth
              size="small"
              autoComplete="off"
              placeholder={`New ${label.toLowerCase()}`}
              value={newName}
              disabled={proposing}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleAdd();
                }
              }}
              sx={{ mt: 0.5 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        size="small"
                        color="primary"
                        aria-label={`Add ${label}`}
                        disabled={proposing || newName.trim().length < 2}
                        onClick={() => void handleAdd()}
                      >
                        {proposing ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        )}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}

/**
 * Multi-select fed by the same catalogue. Typing a value that does not exist
 * offers an inline "Add …" row in the dropdown; picking it saves and selects
 * the new option straight away.
 */
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
  const { data, isLoading } = useGetLookupsQuery({ category });
  const [propose, { isLoading: proposing }] = useProposeLookupMutation();
  const options = useMemo(() => data?.data ?? [], [data]);
  const [inputValue, setInputValue] = useState('');

  const getKey = (item: { name: string; value: string }) =>
    valueMode === 'name' ? item.name : item.value;

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

  const trimmedInput = inputValue.trim();
  const hasExactMatch = options.some(
    (o) => o.name.toLowerCase() === trimmedInput.toLowerCase(),
  );
  const canAdd = allowPropose && trimmedInput.length >= 2 && !hasExactMatch;

  const handleAdd = async (name: string) => {
    try {
      const res = await propose({ category, name }).unwrap();
      const created = res.data;
      if (created) {
        const key = getKey(created);
        if (!values.includes(key)) onChange([...values, key]);
        notify.success(res.message || `"${created.name}" added.`);
      }
      setInputValue('');
    } catch (err) {
      notify.apiError(err, `Could not add "${name}".`);
    }
  };

  // Synthetic row rendered at the end of the dropdown when the typed text is new.
  const addOption: LookupItem = {
    _id: '__add_new__',
    name: trimmedInput,
    value: '__add_new__',
    order: 99999,
    isActive: true,
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

      <Autocomplete
        multiple
        fullWidth
        disableCloseOnSelect
        loading={isLoading || proposing}
        options={canAdd ? [...options, addOption] : options}
        value={selectedOptions}
        inputValue={inputValue}
        onInputChange={(_event, next, reason) => {
          if (reason !== 'reset') setInputValue(next);
        }}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, val) =>
          getKey(option) === getKey(val) || option.name === val.name || option.value === val.value
        }
        filterOptions={(opts, state) => {
          const keyword = state.inputValue.trim().toLowerCase();
          return opts.filter(
            (o) => o.value === '__add_new__' || o.name.toLowerCase().includes(keyword),
          );
        }}
        onChange={(_event, next) => {
          const addRow = next.find((item) => item.value === '__add_new__');
          if (addRow) {
            void handleAdd(addRow.name);
            return;
          }
          onChange([...new Set(next.map((item) => getKey(item)))]);
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
        renderOption={(props, option, { selected }) => {
          const { key, ...liProps } = props as React.HTMLAttributes<HTMLLIElement> & { key?: string };
          if (option.value === '__add_new__') {
            return (
              <li {...liProps} key="__add_new__">
                <AddIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Add "{option.name}"
                </Typography>
              </li>
            );
          }
          return (
            <li {...liProps} key={key ?? option._id}>
              <Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
              {option.name}
            </li>
          );
        }}
        noOptionsText={
          allowPropose ? 'Type at least 2 characters to add a new one' : 'No matches'
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={`Select ${label.toLowerCase()}`}
            placeholder={
              values.length
                ? ''
                : placeholder || (isLoading ? 'Loading…' : `Choose or type to add a new ${label.toLowerCase()}`)
            }
            error={error}
            helperText={helperText}
          />
        )}
      />
    </Box>
  );
}
