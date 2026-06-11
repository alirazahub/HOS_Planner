import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import { Paper, Stack, Typography } from '@mui/material';

import { palette } from '../theme.js';

export default function EmptyState() {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 4, md: 8 },
        textAlign: 'center',
        borderStyle: 'dashed',
        borderColor: palette.line,
        bgcolor: 'transparent',
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <LocalShippingRoundedIcon sx={{ fontSize: 56, color: palette.signGreen }} />
        <Typography variant="h4">Your route plan will appear here</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 520 }}>
          Enter a current location, pickup and drop-off. The planner routes the trip,
          schedules every fuel stop, 30-minute break and 10-hour rest under the
          70&nbsp;hr&nbsp;/&nbsp;8&nbsp;day rules, and draws each day&apos;s ELD log sheet.
        </Typography>
      </Stack>
    </Paper>
  );
}
