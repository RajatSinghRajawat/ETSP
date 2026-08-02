import { Description } from '@mui/icons-material';
import LegalPageView from '../components/common/LegalPageView';
import { useLocalizedSiteContent } from '../hooks/useLocalizedSiteContent';

const TermsOfService: React.FC = () => {
  const { content } = useLocalizedSiteContent();
  return (
    <LegalPageView
      content={content?.terms}
      fallbackIcon={<Description sx={{ fontSize: 52, mb: 2, opacity: 0.9 }} />}
    />
  );
};

export default TermsOfService;
