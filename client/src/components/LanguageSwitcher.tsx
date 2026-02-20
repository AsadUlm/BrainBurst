import { FormControl, Select, MenuItem, Box, Typography, useTheme, SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';

const languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' }
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const theme = useTheme();

    const handleLanguageChange = (event: SelectChangeEvent<string>) => {
        i18n.changeLanguage(event.target.value);
    };

    const currentLang = languages.some(l => l.code === i18n.language) ? i18n.language : 'ru';

    return (
        <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
                value={currentLang}
                onChange={handleLanguageChange}
                sx={{
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.divider
                    }
                }}
            >
                {languages.map((language) => (
                    <MenuItem key={language.code} value={language.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontSize: '1.2em', lineHeight: 1 }}>{language.flag}</span>
                            <Typography variant="body2">{language.name}</Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
