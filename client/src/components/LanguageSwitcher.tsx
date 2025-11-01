import { Button, Menu, MenuItem, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';

const languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' }
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
        handleClose();
    };

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    return (
        <>
            <Button
                onClick={handleClick}
                startIcon={<LanguageIcon fontSize="small" />}
                sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 0,
                    textTransform: 'none',
                    color: theme.palette.text.primary,
                    transition: 'all 0.2s ease',
                    minWidth: 'auto',
                    '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        transform: 'translateY(-1px)'
                    }
                }}
            >
                <span style={{ fontSize: '1.2em', marginLeft: 4 }}>{currentLanguage.flag}</span>
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        borderRadius: 0,
                        border: `1px solid ${theme.palette.divider}`,
                        mt: 1
                    }
                }}
            >
                {languages.map((language) => (
                    <MenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        selected={i18n.language === language.code}
                        sx={{
                            py: 1.5,
                            px: 2,
                            '&.Mui-selected': {
                                backgroundColor: theme.palette.action.selected,
                            },
                            '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            <span style={{ fontSize: '1.5em' }}>{language.flag}</span>
                        </ListItemIcon>
                        <ListItemText>{language.name}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
