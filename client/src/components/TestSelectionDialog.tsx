import { useEffect, useState, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Box, Typography,
    Tabs, Tab, Stack, TextField, InputAdornment, IconButton, FormControl,
    Select, MenuItem, Switch, Card, CardContent, CircularProgress,
    List, ListItem, ListItemButton, ListItemIcon, ListItemText, Chip,
    alpha, useTheme, Badge, Button
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewListIcon from '@mui/icons-material/ViewList';
import QuizIcon from '@mui/icons-material/Quiz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface Category {
    _id: string;
    name: string;
    color?: string;
}

interface Question {
    time?: number;
    questionType?: 'multiple-choice' | 'open' | 'puzzle';
    options?: string[];
}

interface TestData {
    _id: string;
    title: string;
    description?: string;
    questions: Question[];
    timeLimit?: number;
    category?: Category;
    useStandardGlobalTimer?: boolean;
    standardTimeLimit?: number;
    standardQuestionTime?: number;
    useExamGlobalTimer?: boolean;
    examTimeLimit?: number;
    examQuestionTime?: number;
}

interface TestSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    onSelect: (testId: string, testName: string) => void;
}

export default function TestSelectionDialog({ open, onClose, onSelect }: TestSelectionDialogProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const [publicTests, setPublicTests] = useState<TestData[]>([]);
    const [myTests, setMyTests] = useState<TestData[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'questions' | 'time'>('name');
    const [showTimeLimitOnly, setShowTimeLimitOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string>('__all__');

    useEffect(() => {
        if (open) {
            fetchTests();
        } else {
            // reset state on close
            setSearchQuery('');
            setSortBy('name');
            setShowTimeLimitOnly(false);
            setShowFilters(false);
            setSelectedGroup('__all__');
            setActiveTab(0);
        }
    }, [open]);

    const fetchTests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: token ? `Bearer ${token}` : '' };

            const [publicRes, myRes] = await Promise.all([
                fetch('/api/tests', { headers }),
                fetch('/api/tests?showAll=true&limit=1000', { headers })
            ]);

            if (publicRes.ok && myRes.ok) {
                const publicData = await publicRes.json();
                const myData = await myRes.json();

                setPublicTests(publicData);
                setMyTests(myData.tests || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const currentTests = activeTab === 0 ? myTests : publicTests;

    // Filtering & Sorting
    const filteredAndSortedTests = useMemo(() => {
        const filtered = currentTests.filter(test => {
            const matchesSearch = searchQuery === '' ||
                test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                test.description?.toLowerCase().includes(searchQuery.toLowerCase());

            const hasTimeLimit = !!test.timeLimit ||
                !!test.useStandardGlobalTimer ||
                !!test.useExamGlobalTimer ||
                !!test.standardQuestionTime ||
                !!test.examQuestionTime ||
                test.questions?.some((q: Question) => q.time);
            const matchesTimeLimit = !showTimeLimitOnly || hasTimeLimit;

            return matchesSearch && matchesTimeLimit;
        });

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'questions':
                    return (b.questions?.length || 0) - (a.questions?.length || 0);
                case 'time': {
                    const timeA = a.standardTimeLimit || a.examTimeLimit || a.timeLimit ||
                        a.questions?.reduce((sum: number, q: Question) => sum + (q.time || 0), 0) || 0;
                    const timeB = b.standardTimeLimit || b.examTimeLimit || b.timeLimit ||
                        b.questions?.reduce((sum: number, q: Question) => sum + (q.time || 0), 0) || 0;
                    return timeB - timeA;
                }
                default:
                    return 0;
            }
        });

        return filtered;
    }, [currentTests, searchQuery, sortBy, showTimeLimitOnly]);

    // Categories extraction
    const groups = useMemo(() => {
        const map: Record<string, { category: Category | null; tests: TestData[] }> = {};

        filteredAndSortedTests.forEach(test => {
            const cat = test.category && typeof test.category === 'object' ? test.category : null;
            const key = cat ? cat._id : '__uncategorized__';

            if (!map[key]) {
                map[key] = { category: cat, tests: [] };
            }
            map[key].tests.push(test);
        });

        return Object.entries(map)
            .map(([key, val]) => ({
                key,
                name: val.category?.name || t('admin.uncategorized'),
                color: val.category?.color || theme.palette.primary.main,
                count: val.tests.length,
                tests: val.tests
            }))
            .sort((a, b) => {
                if (a.key === '__uncategorized__') return 1;
                if (b.key === '__uncategorized__') return -1;
                return a.name.localeCompare(b.name);
            });
    }, [filteredAndSortedTests, t, theme.palette.primary.main]);

    useEffect(() => {
        if (selectedGroup !== '__all__' && !groups.some(g => g.key === selectedGroup)) {
            setSelectedGroup('__all__');
        }
    }, [groups, selectedGroup, activeTab]);

    const activeGroup = groups.find(g => g.key === selectedGroup);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: '16px', height: '90vh' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
                <Typography variant="h5" fontWeight={700}>Выбор теста</Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)}>
                    <Tab label="Моя Библиотека" sx={{ fontWeight: 600 }} />
                    <Tab label="Публичные тесты" sx={{ fontWeight: 600 }} />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', p: 3, pt: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder={t('test.searchTests')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                                        </InputAdornment>
                                    ),
                                    ...(searchQuery && {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setSearchQuery('')}>
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    })
                                }}
                                sx={{
                                    maxWidth: 400,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        '& fieldset': { borderColor: theme.palette.divider }
                                    }
                                }}
                            />

                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <Select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'name' | 'questions' | 'time')}
                                    displayEmpty
                                    startAdornment={<SortIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.text.secondary }} />}
                                    sx={{
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }
                                    }}
                                >
                                    <MenuItem value="name">{t('test.sortByName')}</MenuItem>
                                    <MenuItem value="questions">{t('test.sortByQuestions')}</MenuItem>
                                    <MenuItem value="time">{t('test.sortByTime')}</MenuItem>
                                </Select>
                            </FormControl>

                            <IconButton
                                size="small"
                                onClick={() => setShowFilters(!showFilters)}
                                sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: '8px',
                                    width: 38,
                                    height: 38
                                }}
                            >
                                <Badge color="primary" variant="dot" invisible={!showTimeLimitOnly}>
                                    <FilterListIcon fontSize="small" />
                                </Badge>
                            </IconButton>
                        </Box>

                        {showFilters && (
                            <Box sx={{ mb: 2, p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                    {t('test.withTimeLimit')}
                                </Typography>
                                <Switch size="small" checked={showTimeLimitOnly} onChange={(e) => setShowTimeLimitOnly(e.target.checked)} />
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', flex: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: '8px', overflow: 'hidden' }}>

                            {/* Left Panel: Categories */}
                            <Box sx={{ width: 240, flexShrink: 0, borderRight: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: theme.palette.text.secondary, textTransform: 'uppercase' }}>
                                        Категории
                                    </Typography>
                                </Box>
                                <List disablePadding sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1 }}>
                                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                                        <ListItemButton
                                            selected={selectedGroup === '__all__'}
                                            onClick={() => setSelectedGroup('__all__')}
                                            sx={{ borderRadius: '8px', py: 1, px: 2 }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 32 }}><ViewListIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText primary={t('test.allCategories')} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: selectedGroup === '__all__' ? 600 : 400 }} />
                                            <Chip label={filteredAndSortedTests.length} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                        </ListItemButton>
                                    </ListItem>
                                    {groups.map((group) => (
                                        <ListItem disablePadding key={group.key} sx={{ mb: 0.5 }}>
                                            <ListItemButton
                                                selected={selectedGroup === group.key}
                                                onClick={() => setSelectedGroup(group.key)}
                                                sx={{ borderRadius: '8px', py: 1, px: 2 }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 32 }}>
                                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: group.color }} />
                                                </ListItemIcon>
                                                <ListItemText primary={group.name} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: selectedGroup === group.key ? 600 : 400, noWrap: true }} />
                                                <Chip label={group.count} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>

                            {/* Right Panel: Tests Grid */}
                            <Box sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: theme.palette.mode === 'dark' ? alpha('#000', 0.1) : alpha('#000', 0.02) }}>
                                {activeGroup?.tests.length === 0 || filteredAndSortedTests.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', mt: 10 }}>
                                        <Typography color="text.secondary">Тесты не найдены</Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                                        {(selectedGroup === '__all__' ? filteredAndSortedTests : activeGroup?.tests || []).map((test) => {
                                            const totalTime = test.standardTimeLimit || test.timeLimit || test.questions?.reduce((sum, q) => sum + (q.time || 0), 0) || 0;
                                            const catColor = test.category?.color || theme.palette.primary.main;

                                            return (
                                                <Card
                                                    key={test._id}
                                                    elevation={0}
                                                    sx={{
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        borderRadius: '12px',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        '&:hover': {
                                                            borderColor: alpha(catColor, 0.5),
                                                            boxShadow: `0 4px 12px ${alpha(catColor, 0.1)}`,
                                                            transform: 'translateY(-2px)'
                                                        }
                                                    }}
                                                >
                                                    <Box sx={{ height: 4, bgcolor: catColor }} />
                                                    <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 1, lineHeight: 1.3 }}>
                                                            {test.title}
                                                        </Typography>
                                                        {test.description && (
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                {test.description}
                                                            </Typography>
                                                        )}

                                                        <Box sx={{ flex: 1 }} />

                                                        <Stack direction="row" spacing={1} sx={{ mt: 2, mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                                            <Chip
                                                                icon={<QuizIcon sx={{ fontSize: '1rem !important' }} />}
                                                                label={`${test.questions?.length || 0} ${t('test.questionsCount')}`}
                                                                size="small"
                                                                sx={{ bgcolor: alpha(catColor, 0.1), color: catColor, fontWeight: 500 }}
                                                            />
                                                            {totalTime > 0 && (
                                                                <Chip
                                                                    icon={<AccessTimeIcon sx={{ fontSize: '1rem !important' }} />}
                                                                    label={`${Math.ceil(totalTime / 60)} мин`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Stack>

                                                        <Button
                                                            variant="outlined"
                                                            fullWidth
                                                            startIcon={<CheckCircleIcon />}
                                                            onClick={() => {
                                                                onSelect(test._id, test.title);
                                                                onClose();
                                                            }}
                                                            sx={{
                                                                borderRadius: '8px',
                                                                color: catColor,
                                                                borderColor: alpha(catColor, 0.5),
                                                                '&:hover': {
                                                                    borderColor: catColor,
                                                                    bgcolor: alpha(catColor, 0.05)
                                                                }
                                                            }}
                                                        >
                                                            Выбрать этот тест
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>

                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
