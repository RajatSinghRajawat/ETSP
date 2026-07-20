import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Box } from '@mui/material';
import { 
  CustomButton, 
  CustomInput, 
  CustomModal, 
  CustomCard, 
  Row, 
  Col, 
  Heading, 
  Text, 
  CustomDivider, 
  CustomDropdown, 
  Toast 
} from '../components/common';

const Showcase = () => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [dropdownVal, setDropdownVal] = useState('');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Heading sx={{ mb: 4 }}>{t('showcase')}</Heading>

      <Row>
        {/* Buttons & Toast */}
        <Col xs={12} md={6}>
          <CustomCard title="Buttons & Toast">
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <CustomButton color="primary">{t('primary_btn')}</CustomButton>
              <CustomButton color="secondary">{t('secondary_btn')}</CustomButton>
              <CustomButton onClick={() => setToastOpen(true)} variant="outlined">
                {t('show_toast')}
              </CustomButton>
            </Box>
          </CustomCard>
        </Col>

        {/* Inputs & Dropdown */}
        <Col xs={12} md={6}>
          <CustomCard title="Inputs & Dropdown">
            <CustomInput label={t('common_input')} placeholder="Type something..." />
            <CustomDropdown 
              label={t('common_dropdown_label')}
              value={dropdownVal}
              onChange={(e: any) => setDropdownVal(e.target.value)}
              options={[
                { label: 'Option 1', value: '1' },
                { label: 'Option 2', value: '2' },
                { label: 'Option 3', value: '3' },
              ]}
            />
          </CustomCard>
        </Col>

        {/* Modal Showcase */}
        <Col xs={12} md={6}>
          <CustomCard title="Modal & Divider">
            <Text sx={{ mb: 2 }}>Click the button below to see the reusable modal.</Text>
            <CustomButton onClick={() => setModalOpen(true)}>{t('open_modal')}</CustomButton>
            <CustomDivider />
            <Text variant="caption">The divider above is a custom component.</Text>
          </CustomCard>
        </Col>

        {/* Card Showcase */}
        <Col xs={12} md={6}>
          <CustomCard title={t('common_card_title')} subheader={t('common_card_sub')}>
            <Text>{t('body_text')}</Text>
          </CustomCard>
        </Col>
      </Row>

      {/* Modal Component */}
      <CustomModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={t('common_modal_title')}
        actions={
          <>
            <CustomButton onClick={() => setModalOpen(false)} variant="text">{t('close')}</CustomButton>
            <CustomButton onClick={() => setModalOpen(false)}>{t('submit')}</CustomButton>
          </>
        }
      >
        <Text>{t('common_modal_body')}</Text>
      </CustomModal>

      {/* Toast Component */}
      <Toast 
        open={toastOpen} 
        onClose={() => setToastOpen(false)} 
        message={t('common_toast_msg')} 
        severity="success" 
      />
    </Container>
  );
};

export default Showcase;
