import { useState } from 'react';
import { Box, CircularProgress, MenuItem, Select, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { EditableJobStatus, JobResponse } from '../../store/api/jobApi';
import { useUpdateJobStatusMutation } from '../../store/api/jobApi';
import { JOB_STATUS_META, SELECTABLE_JOB_STATUSES } from './jobStatus';

type Props = {
  job: JobResponse;
  size?: 'small' | 'medium';
  /** Surfaces the server's reason when a reopen is refused by the plan gate. */
  onError?: (message: string) => void;
  onChanged?: (status: EditableJobStatus) => void;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data;
    return data?.message ?? fallback;
  }
  return fallback;
};

const StatusDot: React.FC<{ color: string }> = ({ color }) => (
  <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
);

/**
 * The job-status dropdown shown on the employer's job list and job detail
 * header. Expired jobs are read-only here: the employer brings one back by
 * picking "Open", which re-runs the plan's entitlement gate server-side.
 */
const JobStatusControl: React.FC<Props> = ({ job, size = 'small', onError, onChanged }) => {
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
          {isLoading ? <CircularProgress size={12} /> : <StatusDot color={meta.color} />}
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }} noWrap>
            {meta.label}
          </Typography>
        </Box>
      )}
      sx={{
        minWidth: 138,
        borderRadius: 2.5,
        bgcolor: 'background.paper',
        '& .MuiSelect-select': { py: 1 },
      }}
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
