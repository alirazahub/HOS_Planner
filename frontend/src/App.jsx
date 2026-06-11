import { Alert, Box, Container, Grid, Stack, Typography } from '@mui/material';
import { useRef, useState } from 'react';

import { planTrip } from './api/client.js';
import EldLogSheet from './components/EldLogSheet.jsx';
import EmptyState from './components/EmptyState.jsx';
import RouteMap from './components/RouteMap.jsx';
import StopsTimeline from './components/StopsTimeline.jsx';
import SummaryBar from './components/SummaryBar.jsx';
import TripForm from './components/TripForm.jsx';
import { palette } from './theme.js';

const HazardStripe = () => (
  <Box
    aria-hidden
    sx={{
      height: 6,
      background: `repeating-linear-gradient(135deg, ${palette.amber} 0 14px, ${palette.pine} 14px 28px)`,
    }}
  />
);

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const resultsRef = useRef(null);

  const handlePlan = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await planTrip(payload);
      setResult(data);
      setTimeout(
        () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        80,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', pb: 8 }}>
      {/* ------------------------------------------------ header */}
      <Box sx={{ bgcolor: palette.pine, color: '#fff' }} className="no-print">
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
          <Stack direction="row" alignItems="baseline" spacing={1.5} flexWrap="wrap">
            <Typography variant="h3" component="h1" sx={{ color: '#fff' }}>
              ROUTE<Box component="span" sx={{ color: palette.amber }}>LOG</Box>
            </Typography>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              HOS Trip Planner · 70 hr / 8 day
            </Typography>
          </Stack>
          <Typography sx={{ mt: 0.5, maxWidth: 720, color: 'rgba(255,255,255,0.82)' }}>
            Enter a trip and get a fully routed plan: driving, fuel, breaks and rests
            scheduled under FMCSA Part 395 with the daily log sheets already drawn.
          </Typography>
        </Container>
        <HazardStripe />
      </Box>

      <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 4 } }}>
        <Grid container spacing={3}>
          {/* -------------------------------------------- input panel */}
          <Grid item xs={12} md={4} lg={3.5} className="no-print">
            <Box sx={{ position: { md: 'sticky' }, top: { md: 16 } }}>
              <TripForm onSubmit={handlePlan} loading={loading} />
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Grid>

          {/* -------------------------------------------- results */}
          <Grid item xs={12} md={8} lg={8.5} ref={resultsRef}>
            {!result && !loading && <EmptyState />}
            {result && (
              <Stack spacing={3}>
                <SummaryBar result={result} />
                <RouteMap result={result} />
                <StopsTimeline plan={result.plan} />
                <Box>
                  <Typography variant="h4" sx={{ mb: 0.5 }}>
                    Daily log sheets
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    One Driver&apos;s Daily Log per 24-hour period, drawn to the
                    FMCSA grid — {result.plan.daily_logs.length}{' '}
                    {result.plan.daily_logs.length === 1 ? 'sheet' : 'sheets'} for this trip.
                  </Typography>
                  <Stack spacing={3}>
                    {result.plan.daily_logs.map((log) => (
                      <EldLogSheet key={log.date} log={log} result={result} />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
