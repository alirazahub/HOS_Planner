import { Grid, Paper, Stack, Typography } from '@mui/material';

import { palette } from '../theme.js';

const fmtDuration = (hours) => {
  const total = Math.round(hours);
  const d = Math.floor(total / 24);
  const h = total - d * 24;
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
};

function Stat({ label, value, sub }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%', borderColor: palette.line }}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontFamily: '"IBM Plex Mono"', fontWeight: 500, lineHeight: 1.15 }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

export default function SummaryBar({ result }) {
  const { plan } = result;
  const stops = plan.stops;
  const count = (kind) => stops.filter((s) => s.kind === kind).length;
  const restarts = count('restart');

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} sm={3}>
        <Stat
          label="Distance"
          value={`${Math.round(plan.total_distance_miles).toLocaleString()} mi`}
          sub={`${plan.total_driving_hours.toFixed(1)} h driving`}
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <Stat
          label="Trip duration"
          value={fmtDuration(plan.total_duration_hours)}
          sub={`${plan.daily_logs.length} log sheet${plan.daily_logs.length === 1 ? '' : 's'}`}
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <Stat
          label="Stops scheduled"
          value={count('fuel') + count('break') + count('rest') + restarts}
          sub={`${count('fuel')} fuel · ${count('break')} break · ${count('rest')} rest${
            restarts ? ` · ${restarts} restart` : ''
          }`}
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <Stat
          label="Cycle at delivery"
          value={`${plan.cycle_used_at_end.toFixed(1)} h`}
          sub="of 70 hr / 8 days"
        />
      </Grid>
    </Grid>
  );
}
