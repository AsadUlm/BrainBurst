import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import WarningIcon from '@mui/icons-material/Warning';

interface ExitConfirmationDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ExitConfirmationDialog({ open, onConfirm, onCancel }: ExitConfirmationDialogProps) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                {t('exitConfirmation.title')}
            </DialogTitle>
            <DialogContent>
                <Typography>{t('exitConfirmation.message')}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onConfirm} color="error" variant="contained">
                    {t('exitConfirmation.leave')}
                </Button>
                <Button onClick={onCancel} variant="outlined" autoFocus>
                    {t('exitConfirmation.stay')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
