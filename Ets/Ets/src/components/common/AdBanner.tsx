import { Box, Container } from '@mui/material';
import {
  useGetBannersQuery,
  useRecordBannerClickMutation,
  type Banner,
  type BannerPlacement,
} from '../../store/api/bannerApi';

interface AdBannerProps {
  placement: BannerPlacement;
  /** Site-wide slots sit flush under the header; in-page slots get their own spacing. */
  variant?: 'section' | 'strip';
}

/**
 * Renders the advertisement banners the admin assigned to one slot. The slot
 * collapses to nothing when no banner is running, so a page never shows a gap
 * where an ad would have been.
 */
const AdBanner: React.FC<AdBannerProps> = ({ placement, variant = 'section' }) => {
  const { data, isLoading } = useGetBannersQuery(placement);
  const [recordClick] = useRecordBannerClickMutation();

  const banners = data?.data ?? [];

  // Most slots run no banner, so reserving space while loading would leave a gap
  // on every page that has none. Render nothing until there is something to show.
  if (isLoading || banners.length === 0) return null;

  const items = banners.map((banner: Banner) => (
    <Box
      key={banner._id}
      component="a"
      href={banner.linkUrl}
      target="_blank"
      // noopener/noreferrer: the advertiser's page must not reach back into ours.
      rel="noopener noreferrer sponsored"
      onClick={() => {
        // Fire and forget — a failed count must never block the visitor.
        recordClick(banner._id);
      }}
      sx={{
        display: 'block',
        borderRadius: variant === 'strip' ? 0 : 2,
        overflow: 'hidden',
        lineHeight: 0,
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        '&:hover': variant === 'strip' ? undefined : {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 28px -14px rgba(12,82,131,0.45)',
        },
      }}
    >
      <Box
        component="img"
        src={banner.imageUrl}
        alt={banner.altText || 'Advertisement'}
        loading="lazy"
        sx={{ display: 'block', width: '100%', height: 'auto' }}
      />
    </Box>
  ));

  if (variant === 'strip') {
    return <Box sx={{ width: '100%' }}>{items}</Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 } }}>{items}</Box>
    </Container>
  );
};

export default AdBanner;
