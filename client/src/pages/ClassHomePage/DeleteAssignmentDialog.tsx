import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTranslation, Trans } from 'react-i18next';

interface DeleteAssignmentDialogProps {
    open: boolean;
    onClose: () => void;
    onDelete: () => Promise<void>;
    assignmentTitle: string;
}

export default function DeleteAssignmentDialog({
    open,
    onClose,
    onDelete,
    assignmentTitle
}: DeleteAssignmentDialogProps) {
    const theme = useTheme();
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    // Сбрасываем инпут при открытии
    useEffect(() => {
        if (open) {
            setInputValue('');
            setLoading(false);
        }
    }, [open]);

    const isMatch = inputValue.trim() === assignmentTitle.trim();

    const handleDelete = async () => {
        if (!isMatch) return;
        setLoading(true);
        try {
            await onDelete();
        } catch (error) {
            console.error('Ошибка удаления:', error);
        } finally {
            setLoading(false);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.error.main }}>
                <WarningAmberIcon />
                {t('classHome.deleteAssignmentTitle')}
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    {t('classHome.aboutToDeleteAssignment')} <Typography component="span" fontWeight={600}>"{assignmentTitle}"</Typography>.
                </DialogContentText>

                <Box sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), p: 2, borderRadius: 1, mb: 3 }}>
                    <Typography variant="body2" color="error.main" fontWeight={500}>
                        <Trans i18nKey="classHome.deleteWarningMessage" components={{ b: <b /> }} />
                    </Typography>
                </Box>

                <DialogContentText sx={{ mb: 1 }}>
                    {t('classHome.confirmDeletePrompt')}
                </DialogContentText>

                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={assignmentTitle}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                    autoFocus
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} disabled={loading} color="inherit">
                    {t('classHome.cancel')}
                </Button>
                <Button
                    onClick={handleDelete}
                    disabled={!isMatch || loading}
                    color="error"
                    variant="contained"
                >
                    {loading ? t('classHome.deleting') : t('classHome.deletePermanently')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
