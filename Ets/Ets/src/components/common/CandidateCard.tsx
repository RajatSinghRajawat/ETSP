import { Card, CardContent, Typography, Box, Chip, Button, Avatar } from '@mui/material';
import { Lock } from '@mui/icons-material';

interface CandidateCardProps {
  name: string;
  specialty: string;
  experience: number;
  skills: string[];
  photo?: string;
  onUnlock?: () => void;
  blurred?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  name,
  specialty,
  experience,
  skills = [],
  photo,
  onUnlock,
  blurred = true
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        textAlign: 'center',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'secondary.main',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          transform: 'translateY(-5px)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Avatar
          src={photo || `https://i.pravatar.cc/150?u=${name.replace(/\s/g, '')}`}
          sx={{
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 2,
            border: '3px solid',
            borderColor: 'rgba(10, 182, 162, 0.1)'
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          {name}
        </Typography>
        <Typography variant="subtitle2" color="secondary" sx={{ fontWeight: 600, mb: 2, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
          {specialty}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {experience} years experience
        </Typography>

        {blurred && (
          <Box sx={{ mb: 2, filter: 'blur(4px)', userSelect: 'none', opacity: 0.5 }}>
            <Typography variant="caption">contact@{name.toLowerCase().replace(/\s/g, '')}.com</Typography>
            <br />
            <Typography variant="caption">+91 98765 XXXXX</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', mb: 3 }}>
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

        {onUnlock && (
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            startIcon={<Lock />}
            onClick={onUnlock}
            sx={{ fontWeight: 700, fontSize: '0.85rem' }}
          >
            {blurred ? 'Unlock Profile' : 'View Full Profile'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateCard;
