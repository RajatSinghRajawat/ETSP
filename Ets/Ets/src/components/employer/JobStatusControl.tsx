import { useState } from 'react';
import { Box, CircularProgress, MenuItem, Select, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { SelectChangeEvent, SxProps, Theme } from '@mui/material';
import type { EditableJobStatus, JobResponse } from '../../store/api/jobApi';
import { useUpdateJobStatusMutation } from '../../store/api/jobApi';
import { JOB_STATUS_META, SELECTABLE_JOB_STATUSES } from './jobStatus';

type Props = {
  job: JobResponse;
  size?: 'small' | 'medium';
  /** Surfaces the server's reason when a reopen is refused by the plan gate. */
  onError?: (message: string) => void;
  onChanged?: (status: EditableJobStatus) => void;
  sx?: SxProps<Theme>;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data;
    return data?.message ?? fallback;
  }
  return fallback;
};

const StatusDot: React.FC<{ color: string; pulse?: boolean }> = ({ color, pulse }) => (
  <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 12, height: 12, flexShrink: 0 }}>
    {pulse && (
      <Box
        sx={{
          position: 'absolute',
          width: 14,
          height: 14,
          borderRadius: '50%',
          bgcolor: color,
          opacity: 0.35,
          animation: 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          '@keyframes pulseGlow': {
            '0%, 100%': { transform: 'scale(0.8)', opacity: 0.4 },
            '50%': { transform: 'scale(1.5)', opacity: 0 },
          },
        }}
      />
    )}
    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, zIndex: 1, boxShadow: `0 0 4px ${color}` }} />
  </Box>
);

/**
 * The job-status dropdown shown on the employer's job list and job detail
 * header. Expired jobs are read-only here: the employer brings one back by
 * picking "Open", which re-runs the plan's entitlement gate server-side.
 */
const JobStatusControl: React.FC<Props> = ({ job, size = 'small', onError, onChanged, sx }) => {
  const [updateJobStatus, { isLoading }] = useUpdateJobStatusMutation();
  const [pending, setPending] = useState<EditableJobStatus | null>(null);

  const handleChange = async (event: SelectChangeEvent<string>) => {
    const next = event.target.value as EditableJobStatus;
    if (next === job.status) return;

    setPending(next);
    try {
      await updateJobStatus({ id: job._id, status: next }).unwrap();
      onChanged?.(next);
    } catch (error) {
      onError?.(getApiErrorMessage(error, 'Could not change the job status. Please try again.'));
    } finally {
      setPending(null);
    }
  };

  // 'expired' is never in the option list, so show it as its own disabled entry
  // rather than letting the Select fall back to a blank value.
  const value = pending ?? job.status;
  const options: EditableJobStatus[] = SELECTABLE_JOB_STATUSES;
  const meta = JOB_STATUS_META[value] ?? JOB_STATUS_META.draft;

  return (
    <Select
      size={size}
      value={value}
      onChange={handleChange}
      disabled={isLoading}
      renderValue={() => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {isLoading ? <CircularProgress size={12} /> : <StatusDot color={meta.color} pulse={value === 'active'} />}
          <Typography sx={{ fontWeight: 700, fontSize: '0.84rem' }} noWrap>
            {meta.label}
          </Typography>
        </Box>
      )}
      sx={[
        {
          minWidth: 124,
          borderRadius: '10px',
          bgcolor: '#ffffff',
          border: '1px solid',
          borderColor: (theme) => alpha(meta.color, theme.palette.mode === 'light' ? 0.35 : 0.5),
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          transition: 'all 0.15s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '&:hover': {
            borderColor: meta.color,
            bgcolor: (theme) => alpha(meta.color, 0.04),
            boxShadow: (theme) => `0 2px 8px ${alpha(meta.color, 0.15)}`,
          },
          '& .MuiSelect-select': {
            py: 0.65,
            px: 1.35,
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiSelect-icon': {
            color: '#64748b',
            fontSize: 20,
            right: 8,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {job.status === 'expired' && (
        <MenuItem value="expired" disabled>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatusDot color={JOB_STATUS_META.expired.color} />
            {JOB_STATUS_META.expired.label}
          </Box>
        </MenuItem>
      )}
      {options.map((status) => (
        <MenuItem key={status} value={status}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatusDot color={JOB_STATUS_META[status].color} />
            {JOB_STATUS_META[status].label}
          </Box>
        </MenuItem>
      ))}
    </Select>
  );
};

export default JobStatusControl;
