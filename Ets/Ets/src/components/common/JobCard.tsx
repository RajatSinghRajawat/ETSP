import { Card, CardContent, Typography, Box, Chip, Button } from '@mui/material';
import { LocationOn, AttachMoney } from '@mui/icons-material';

interface JobCardProps {
  title: string;
  clinic: string;
  location: string;
  salary: string;
  type: string;
  skills?: string[];
  onApply?: () => void;
  onClick?: () => void;
  featured?: boolean;
  urgent?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  title,
  clinic,
  location,
  salary,
  type,
  skills = [],
  onApply,
  onClick,
  featured = false,
  urgent = false
}) => {
  return (
    <Card
      onClick={onClick}
      elevation={featured ? 4 : 1}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: featured ? 'primary.main' : 'divider',
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'translateY(-6px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
          borderColor: 'primary.main'
        } : {}
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {(featured || urgent) && (
          <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5 }}>
            {featured && (
              <Chip
                label="Featured"
                size="small"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem'
                }}
              />
            )}
            {urgent && (
              <Chip
                label="Urgent Hiring"
                size="small"
                sx={{
                  bgcolor: '#ef4444',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem'
                }}
              />
            )}
          </Box>
        )}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: '1.1rem' }}>
          {title}
        </Typography>
        <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
          {clinic}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, color: 'text.secondary' }}>
          <LocationOn sx={{ fontSize: 18, color: 'secondary.main' }} />
          <Typography variant="body2">{location}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2 }}>
          <AttachMoney sx={{ fontSize: 18, color: 'success.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{salary}</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {skills.slice(0, 3).map((skill) => (
            <Chip
              key={skill}
              label={skill}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.65rem' }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={type}
            size="small"
            sx={{
              bgcolor: type === 'Full-time' ? 'rgba(10, 182, 162, 0.1)' : 'rgba(12, 82, 131, 0.1)',
              color: type === 'Full-time' ? '#0ab6a2' : '#0c5283',
              fontWeight: 600,
              fontSize: '0.7rem'
            }}
          />
          {onApply && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              sx={{ fontWeight: 700, fontSize: '0.8rem' }}
            >
              Apply
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default JobCard;
