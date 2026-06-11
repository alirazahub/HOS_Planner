import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import RouteRoundedIcon from '@mui/icons-material/RouteRounded';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  Link,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { palette } from '../theme.js';

const EXAMPLE = {
  current_location: 'Chicago, IL',
  pickup_location: 'St. Louis, MO',
  dropoff_location: 'Los Angeles, CA',
  current_cycle_used: 22,
};

const marks = [0, 17.5, 35, 52.5, 70].map((v) => ({ value: v, label: `${v}` }));

export default function TripForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: 0,
  });
  const [touched, setTouched] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const blur = (key) => () => setTouched((t) => ({ ...t, [key]: true }));
  const errorFor = (key) => touched[key] && !form[key].trim();

  const ready =
    form.current_location.trim() &&
    form.pickup_location.trim() &&
    form.dropoff_location.trim();

  const submit = (e) => {
    e.preventDefault();
    if (!ready || loading) return;
    onSubmit({ ...form, current_cycle_used: Number(form.current_cycle_used) });
  };

  const fields = [
    {
      key: 'current_location',
      label: 'Current location',
      placeholder: 'e.g. Chicago, IL',
      icon: <MyLocationRoundedIcon fontSize="small" />,
    },
    {
      key: 'pickup_location',
      label: 'Pickup location',
      placeholder: 'e.g. St. Louis, MO',
      icon: <InventoryRoundedIcon fontSize="small" />,
    },
    {
      key: 'dropoff_location',
      label: 'Drop-off location',
      placeholder: 'e.g. Los Angeles, CA',
      icon: <FlagRoundedIcon fontSize="small" />,
    },
  ];

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderColor: palette.line }}>
      <Typography variant="h5" sx={{ mb: 0.25 }}>
        Plan a trip
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Three locations and your cycle hours — the planner handles the rest.
      </Typography>

      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          {fields.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChange={set(f.key)}
              onBlur={blur(f.key)}
              error={Boolean(errorFor(f.key))}
              helperText={errorFor(f.key) ? 'Enter a city, address or place.' : ' '}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: palette.signGreen }}>
                    {f.icon}
                  </InputAdornment>
                ),
              }}
            />
          ))}

          <Box sx={{ px: 0.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Current cycle used
              </Typography>
              <Typography sx={{ fontFamily: '"IBM Plex Mono"', fontWeight: 500 }}>
                {Number(form.current_cycle_used).toFixed(1)} / 70 hrs
              </Typography>
            </Stack>
            <Slider
              value={Number(form.current_cycle_used)}
              onChange={(_, v) => setForm((f) => ({ ...f, current_cycle_used: v }))}
              min={0}
              max={70}
              step={0.5}
              marks={marks}
              color="secondary"
              aria-label="Current cycle used in hours"
            />
            <Typography variant="caption" color="text.secondary">
              On-duty hours already used in the rolling 8-day period.
            </Typography>
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!ready || loading}
            startIcon={
              loading ? <CircularProgress size={18} color="inherit" /> : <RouteRoundedIcon />
            }
            sx={{ py: 1.2 }}
          >
            {loading ? 'Routing & scheduling…' : 'Plan trip'}
          </Button>

          <Divider flexItem />
          <Typography variant="caption" color="text.secondary">
            No trip handy?{' '}
            <Link
              component="button"
              type="button"
              onClick={() => {
                setForm(EXAMPLE);
                setTouched({});
              }}
            >
              Load an example
            </Link>{' '}
            — Chicago → St. Louis → Los Angeles with 22 cycle hours used.
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
}
