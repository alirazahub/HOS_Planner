import { Box, Chip, Paper, Stack, Typography } from '@mui/material';

import { palette } from '../theme.js';

const KIND_META = {
  start: { color: palette.pine, name: 'START' },
  pickup: { color: palette.signGreen, name: 'PICKUP' },
  dropoff: { color: '#B3402A', name: 'DROP-OFF' },
  fuel: { color: palette.amberDark, name: 'FUEL' },
  break: { color: '#5B8DB8', name: 'BREAK' },
  rest: { color: palette.status.sleeper, name: 'REST' },
  restart: { color: '#7A4FA0', name: 'RESTART' },
};

const fmtTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

const fmtDur = (h) => {
  if (!h) return null;
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${h} h`;
};

export default function StopsTimeline({ plan }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderColor: palette.line }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Trip schedule
      </Typography>
      <Stack spacing={0}>
        {plan.stops.map((s, i) => {
          const meta = KIND_META[s.kind] || KIND_META.break;
          const last = i === plan.stops.length - 1;
          return (
            <Stack key={i} direction="row" spacing={2}>
              {/* rail */}
              <Stack alignItems="center" sx={{ width: 18 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: meta.color,
                    border: '2.5px solid #fff',
                    boxShadow: `0 0 0 2px ${meta.color}55`,
                    mt: '5px',
                    flexShrink: 0,
                  }}
                />
                {!last && (
                  <Box sx={{ width: 2, flexGrow: 1, bgcolor: palette.line, my: 0.5 }} />
                )}
              </Stack>
              {/* content */}
              <Box sx={{ pb: last ? 0 : 2, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography sx={{ fontWeight: 700 }}>{s.label}</Typography>
                  <Chip
                    size="small"
                    label={meta.name}
                    sx={{
                      height: 20,
                      fontSize: 11,
                      bgcolor: `${meta.color}1A`,
                      color: meta.color,
                    }}
                  />
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: '"IBM Plex Mono"', color: palette.inkSoft }}
                >
                  {fmtTime(s.time)} · mile {Math.round(s.mile_marker).toLocaleString()}
                  {fmtDur(s.duration_hours) ? ` · ${fmtDur(s.duration_hours)}` : ''}
                </Typography>
                {s.location && s.kind !== 'fuel' && s.kind !== 'break' && (
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 560 }}>
                    {s.location}
                  </Typography>
                )}
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}
