import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, CircularProgress, Typography,
    Box, alpha, Stack, MenuItem
} from '@mui/material';
import TestSelectionDialog from '../../components/TestSelectionDialog';
import { useTranslation } from 'react-i18next';

interface AssignTestDialogProps {
    open: boolean;
    onClose: () => void;
    classId: string;
    onAssignSuccess: () => void;
}

export default function AssignTestDialog({ open, onClose, classId, onAssignSuccess }: AssignTestDialogProps) {
    const { t } = useTranslation();
    const [selectedTestId, setSelectedTestId] = useState('');
    const [selectedTestName, setSelectedTestName] = useState('');
    const [customTitle, setCustomTitle] = useState('');
    const [selectionOpen, setSelectionOpen] = useState(false);

    const [dueDate, setDueDate] = useState('');
    const [attemptsAllowed, setAttemptsAllowed] = useState<number | ''>('');
    const [maxScore, setMaxScore] = useState<number | ''>(100);
    const [rewardMode, setRewardMode] = useState<'none' | 'simple' | 'advanced'>('none');
    const [rewardAmount, setRewardAmount] = useState<string>('5');
    const [rewardPolicy, setRewardPolicy] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!open) {
            // Reset form
            setSelectedTestId('');
            setSelectedTestName('');
            setCustomTitle('');
            setDueDate('');
            setAttemptsAllowed('');
            setMaxScore(100);
            setRewardMode('none');
            setRewardAmount('5');
            setRewardPolicy('');
            setErrorMsg('');
        }
    }, [open]);

    const handleAssign = async () => {
        if (!selectedTestId) {
            setErrorMsg(t('classHome.selectTestError'));
            return;
        }

        setSubmitting(true);
        setErrorMsg('');

        try {
            const token = localStorage.getItem('token');
            let finalRewardPolicy = null;
            if (rewardMode === 'simple') {
                finalRewardPolicy = rewardAmount || '5';
            } else if (rewardMode === 'advanced') {
                finalRewardPolicy = rewardPolicy || null;
            }

            const body = {
                testId: selectedTestId,
                classId,
                title: customTitle.trim() || undefined,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                attemptsAllowed: attemptsAllowed ? Number(attemptsAllowed) : null,
                maxScore: maxScore === '' ? null : Number(maxScore),
                rewardPolicy: finalRewardPolicy
            };

            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token} `
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                onAssignSuccess();
                onClose();
            } else {
                const data = await res.json();
                setErrorMsg(data.error || t('classHome.assignTestError'));
            }
        } catch (e) {
            console.error(e);
            setErrorMsg(t('classHome.networkError'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h5" fontWeight={700}>{t('classHome.assignTestTitle')}</Typography>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                            {t('classHome.testToAssign')}
                        </Typography>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="medium"
                            onClick={() => setSelectionOpen(true)}
                            color={errorMsg && !selectedTestId ? 'error' : 'primary'}
                            sx={{
                                justifyContent: 'flex-start',
                                py: 1,
                                fontSize: '1rem',
                                color: selectedTestId ? 'text.primary' : 'text.secondary',
                                borderColor: selectedTestId ? alpha('#1976d2', 0.5) : undefined,
                                bgcolor: selectedTestId ? alpha('#1976d2', 0.05) : undefined,
                                textTransform: 'none'
                            }}
                        >
                            {selectedTestName || t('classHome.clickToSelectTest')}
                        </Button>
                    </Box>

                    <TestSelectionDialog
                        open={selectionOpen}
                        onClose={() => setSelectionOpen(false)}
                        onSelect={(id, name) => {
                            setSelectedTestId(id);
                            setSelectedTestName(name);
                            if (!customTitle || customTitle === selectedTestName) {
                                setCustomTitle(name);
                            }
                            setSelectionOpen(false);
                            setErrorMsg('');
                        }}
                    />

                    <TextField
                        fullWidth
                        label={t('classHome.assignmentName')}
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        helperText={t('classHome.assignmentNameHelper')}
                        disabled={!selectedTestId}
                        size="small"
                    />

                    <Stack direction="row" spacing={2} alignItems="flex-start">
                        <TextField
                            fullWidth
                            label="Макс. балл"
                            type="number"
                            value={maxScore}
                            onChange={(e) => setMaxScore(e.target.value === '' ? '' : Number(e.target.value))}
                            inputProps={{ min: 1 }}
                            helperText="По умолчанию 100"
                            size="small"
                        />
                        <TextField
                            fullWidth
                            label={t('classHome.attemptsLimit')}
                            type="number"
                            value={attemptsAllowed}
                            onChange={(e) => setAttemptsAllowed(e.target.value === '' ? '' : Number(e.target.value))}
                            inputProps={{ min: 1 }}
                            helperText={t('classHome.attemptsLimitHelper')}
                            size="small"
                        />
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="flex-start">
                        <TextField
                            fullWidth
                            label={t('classHome.dueDateLabel')}
                            type="datetime-local"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            helperText={t('classHome.dueDateHelper')}
                            size="small"
                        />
                        <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                        <TextField
                            fullWidth
                            select
                            label={t('classHome.rewardPolicyLabel') || 'Награда (Гемы)'}
                            value={rewardMode}
                            onChange={(e) => setRewardMode(e.target.value as any)}
                            size="small"
                            sx={{ flex: 1 }}
                        >
                            <MenuItem value="none">Без наград</MenuItem>
                            <MenuItem value="simple">За 100% результат</MenuItem>
                            <MenuItem value="advanced">Свой формат</MenuItem>
                        </TextField>

                        {rewardMode === 'simple' && (
                            <TextField
                                fullWidth
                                label="Количество гемов"
                                type="number"
                                inputProps={{ min: 1 }}
                                value={rewardAmount}
                                onChange={(e) => setRewardAmount(e.target.value)}
                                helperText="Награда за идеальный результат"
                                size="small"
                                sx={{ flex: 1 }}
                            />
                        )}

                        {rewardMode === 'advanced' && (
                            <TextField
                                fullWidth
                                label="Формат условия"
                                value={rewardPolicy}
                                onChange={(e) => setRewardPolicy(e.target.value)}
                                helperText={t('classHome.rewardPolicyHelper') || "e.g 'percentage >= 80 ? 10'"}
                                size="small"
                                sx={{ flex: 1 }}
                            />
                        )}
                        {rewardMode === 'none' && (
                            <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
                        )}
                    </Stack>

                    {errorMsg && (
                        <Typography color="error" variant="body2">{errorMsg}</Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button onClick={onClose} sx={{ borderRadius: '10px', fontWeight: 600 }}>{t('classHome.cancel')}</Button>
                <Button
                    onClick={handleAssign}
                    variant="contained"
                    disabled={!selectedTestId || submitting}
                    sx={{ borderRadius: '10px', px: 4, fontWeight: 600 }}
                >
                    {submitting ? <CircularProgress size={24} color="inherit" /> : t('classHome.assign')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
