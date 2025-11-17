import { Paper, Typography, Box, useTheme, Stack, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Category as CategoryIcon } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryBreakdownProps {
    data: any[];
}

export default function CategoryBreakdown({ data }: CategoryBreakdownProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <Paper
                    elevation={3}
                    sx={{
                        p: 2,
                        bgcolor: 'background.paper',
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {payload[0].name}
                    </Typography>
                    <Typography variant="body2">
                        {t('analytics.testsCompleted')}: {payload[0].payload.tests}
                    </Typography>
                    <Typography variant="body2" color="primary">
                        {t('analytics.avgScore')}: {payload[0].value}%
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CategoryIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('analytics.categoryBreakdown')}
                </Typography>
            </Box>

            {data.length === 0 ? (
                <Box
                    sx={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography color="text.secondary">
                        {t('analytics.noDataAvailable')}
                    </Typography>
                </Box>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                    percent ? `${name}: ${(percent * 100).toFixed(0)}%` : name
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="tests"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || theme.palette.primary.main} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    <Stack spacing={1} sx={{ mt: 2 }}>
                        {data.map((category, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1.5,
                                    borderLeft: `4px solid ${category.color}`,
                                    bgcolor: theme.palette.grey[50],
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {category.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Chip
                                        label={`${category.tests} ${t('analytics.tests')}`}
                                        size="small"
                                        sx={{ borderRadius: 0 }}
                                    />
                                    <Chip
                                        label={`${category.avgScore}%`}
                                        size="small"
                                        color="primary"
                                        sx={{ borderRadius: 0 }}
                                    />
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </>
            )}
        </Paper>
    );
}
