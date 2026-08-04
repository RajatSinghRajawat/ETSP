import { useState } from 'react';
import {
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy,
  IosShare,
  Share as ShareIcon,
  WhatsApp,
} from '@mui/icons-material';
import EmailIcon from '@mui/icons-material/Email';
import XIcon from '@mui/icons-material/X';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import notify from '../../utils/toast';

type ShareButtonProps = {
  /** Absolute or app-relative URL. Relative paths are resolved against the current origin. */
  url: string;
  title: string;
  /** Longer blurb used by the native sheet and as the message prefix elsewhere. */
  text?: string;
  variant?: 'icon' | 'button';
  size?: 'small' | 'medium' | 'large';
  label?: string;
  /** Stops the click bubbling to a parent card/link. Defaults to true. */
  stopPropagation?: boolean;
  color?: string;
  sx?: object;
};

function toAbsolute(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === 'undefined') return url;
  return new URL(url, window.location.origin).toString();
}

async function copyToClipboard(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the legacy path below (clipboard API needs a secure context).
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Share control used on jobs and profiles. On devices that support it this
 * opens the OS share sheet (the Zomato/Instagram behaviour); elsewhere it falls
 * back to a menu with WhatsApp / X / LinkedIn / Facebook / email / copy link.
 */
export default function ShareButton({
  url,
  title,
  text,
  variant = 'icon',
  size = 'small',
  label = 'Share',
  stopPropagation = true,
  color,
  sx,
}: ShareButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const shareUrl = toAbsolute(url);
  const shareText = text || title;

  const openMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleClick = async (event: React.MouseEvent<HTMLElement>) => {
    if (stopPropagation) event.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch (err) {
        // User dismissed the sheet — not an error worth surfacing.
        if ((err as DOMException)?.name === 'AbortError') return;
        // Anything else: fall back to the menu.
      }
    }

    openMenu(event);
  };

  const handleCopy = async () => {
    closeMenu();
    const ok = await copyToClipboard(shareUrl);
    if (ok) notify.success('Link copied to clipboard.');
    else notify.error('Could not copy the link. Please copy it from the address bar.');
  };

  const openExternal = (target: string) => {
    closeMenu();
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const targets = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: <WhatsApp fontSize="small" sx={{ color: '#25D366' }} />,
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
    },
    {
      key: 'x',
      label: 'X (Twitter)',
      icon: <XIcon fontSize="small" />,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: <LinkedInIcon fontSize="small" sx={{ color: '#0A66C2' }} />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: <FacebookIcon fontSize="small" sx={{ color: '#1877F2' }} />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      key: 'email',
      label: 'Email',
      icon: <EmailIcon fontSize="small" sx={{ color: '#0c5283' }} />,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
    },
  ];

  return (
    <>
      {variant === 'button' ? (
        <Button
          onClick={handleClick}
          size={size === 'small' ? 'small' : 'medium'}
          startIcon={<IosShare fontSize="small" />}
          sx={{ textTransform: 'none', fontWeight: 700, ...sx }}
        >
          {label}
        </Button>
      ) : (
        <Tooltip title={label}>
          <IconButton
            onClick={handleClick}
            size={size}
            aria-label={label}
            sx={{ color: color ?? 'text.secondary', ...sx }}
          >
            <ShareIcon fontSize={size === 'large' ? 'medium' : 'small'} />
          </IconButton>
        </Tooltip>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 210, borderRadius: 2.5 } } }}
      >
        {targets.map((target) => (
          <MenuItem key={target.key} onClick={() => openExternal(target.href)}>
            <ListItemIcon>{target.icon}</ListItemIcon>
            <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>{target.label}</ListItemText>
          </MenuItem>
        ))}
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Copy link</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
