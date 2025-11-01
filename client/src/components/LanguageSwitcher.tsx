import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';

const languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' }
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
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
            <IconButton
                onClick={handleClick}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                }}
            >
                <LanguageIcon />
                <span style={{ fontSize: '1.2em' }}>{currentLanguage.flag}</span>
            </IconButton>
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
            >
                {languages.map((language) => (
                    <MenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        selected={i18n.language === language.code}
                    >
                        <ListItemIcon>
                            <span style={{ fontSize: '1.5em' }}>{language.flag}</span>
                        </ListItemIcon>
                        <ListItemText>{language.name}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
