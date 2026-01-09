import { Box, Typography, Stack, useTheme, ButtonBase } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';

const languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' }
];

export default function LanguageSwitcher() {
    const { i18n, t } = useTranslation();
    const theme = useTheme();

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
    };

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <LanguageIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {t('common.language')}
                </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
                {languages.map((language) => (
                    <ButtonBase
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        sx={{
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            border: `1px solid ${i18n.language === language.code ? theme.palette.primary.main : theme.palette.divider}`,
                            backgroundColor: i18n.language === language.code ? theme.palette.primary.light : 'transparent',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: i18n.language === language.code
                                    ? theme.palette.primary.light
                                    : theme.palette.action.hover,
                                borderColor: theme.palette.primary.main
                            }
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <span style={{ fontSize: '1.2em' }}>{language.flag}</span>
                            <Typography
                                variant="body2"
                                fontWeight={i18n.language === language.code ? 600 : 400}
                                color={i18n.language === language.code ? 'primary' : 'text.primary'}
                            >
                                {language.name}
                            </Typography>
                        </Stack>
                    </ButtonBase>
                ))}
            </Stack>
        </Box>
    );
}
