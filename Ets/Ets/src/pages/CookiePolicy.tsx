import { Cookie } from '@mui/icons-material';
import LegalPageView from '../components/common/LegalPageView';
import { useLocalizedSiteContent } from '../hooks/useLocalizedSiteContent';

const CookiePolicy: React.FC = () => {
  const { content } = useLocalizedSiteContent();
  return (
    <LegalPageView
      content={content?.cookies}
      fallbackIcon={<Cookie sx={{ fontSize: 52, mb: 2, opacity: 0.9 }} />}
    />
  );
};

export default CookiePolicy;
