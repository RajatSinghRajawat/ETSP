import { 
  Button as MuiButton, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Card as MuiCard, 
  CardContent, 
  CardHeader, 
  Divider, 
  Typography, 
  Box, 
  Grid, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Snackbar, 
  Alert 
} from '@mui/material';
import React from 'react';

export const CustomButton: React.FC<any> = (props) => (
  <MuiButton variant="contained" {...props} />
);

export const CustomInput: React.FC<any> = (props) => (
  <TextField fullWidth variant="outlined" margin="normal" {...props} />
);

export const CustomModal: React.FC<any> = ({ open, onClose, title, children, actions }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>{title}</DialogTitle>
    <DialogContent dividers>{children}</DialogContent>
    <DialogActions>{actions}</DialogActions>
  </Dialog>
);

export const CustomCard: React.FC<any> = ({ title, subheader, children, ...props }) => (
  <MuiCard elevation={2} {...props}>
    {(title || subheader) && <CardHeader title={title} subheader={subheader} />}
    <CardContent>{children}</CardContent>
  </MuiCard>
);

export const Row: React.FC<any> = (props) => <Grid container spacing={2} {...props} />;
export const Col: React.FC<any> = (props) => <Grid {...props} />;

export const Heading: React.FC<any> = (props) => <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }} {...props} />;
export const Text: React.FC<any> = (props) => <Typography variant="body1" {...props} />;

export const CustomDivider: React.FC<any> = (props) => <Divider sx={{ my: 2 }} {...props} />;

export const CustomDropdown: React.FC<any> = ({ label, options, value, onChange, ...props }) => (
  <FormControl fullWidth margin="normal">
    <InputLabel>{label}</InputLabel>
    <Select value={value} label={label} onChange={onChange} {...props}>
      {options.map((opt: any) => (
        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
      ))}
    </Select>
  </FormControl>
);

export const Toast: React.FC<any> = ({ open, message, severity, onClose }) => (
  <Snackbar open={open} autoHideDuration={4000} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
    <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
      {message}
    </Alert>
  </Snackbar>
);
