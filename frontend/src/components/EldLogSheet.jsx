import { Box, Paper, Stack, Typography } from '@mui/material';

import { palette, STATUS_META } from '../theme.js';

/**
 * One Driver's Daily Log, drawn as SVG to the FMCSA paper-log layout:
 * header fields, the 24-hour × 4-row graph grid with quarter-hour
 * ticks, the duty line in ballpoint blue, per-status totals, and a
 * remarks band with angled location notes at each duty change.
 */

const ROWS = ['off_duty', 'sleeper', 'driving', 'on_duty'];

// geometry (SVG user units)
const W = 1060;
const GX0 = 130; // grid left
const GX1 = 990; // grid right
const GY0 = 38; // grid top
const ROW_H = 42;
const GY1 = GY0 + ROW_H * 4;
const HOUR_W = (GX1 - GX0) / 24;
const REMARK_H = 96;
const H = GY1 + REMARK_H + 26;

const x = (hour) => GX0 + hour * HOUR_W;
const rowMid = (i) => GY0 + i * ROW_H + ROW_H / 2;

const HOUR_LABELS = [
  'Mid', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
  'Noon', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', 'Mid',
];

const fmtHrs = (h) => {
  const whole = Math.floor(h + 1e-6);
  const mins = Math.round((h - whole) * 60);
  if (mins === 0) return `${whole}`;
  return `${whole}:${String(mins).padStart(2, '0')}`;
};

function HeaderField({ label, value, width = 'auto', mono = false }) {
  return (
    <Box sx={{ width }}>
      <Typography
        sx={{
          fontFamily: mono ? '"IBM Plex Mono"' : '"Barlow"',
          fontWeight: mono ? 500 : 600,
          fontSize: 15,
          borderBottom: `1.5px solid ${palette.ink}`,
          minHeight: 24,
          lineHeight: '24px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </Typography>
      <Typography sx={{ fontSize: 10.5, color: palette.inkSoft, letterSpacing: '0.04em' }}>
        {label.toUpperCase()}
      </Typography>
    </Box>
  );
}

export default function EldLogSheet({ log, result }) {
  const date = new Date(`${log.date}T00:00:00`);
  const inputs = result.inputs;

  // ---- duty line path -------------------------------------------------
  let path = '';
  log.grid.forEach((g, i) => {
    const y = rowMid(ROWS.indexOf(g.status));
    const xs = x(g.start_hour);
    const xe = x(g.end_hour);
    path += i === 0 ? `M ${xs} ${y}` : ` L ${xs} ${y}`;
    path += ` L ${xe} ${y}`;
  });

  // ---- remarks (thin out if crowded) ----------------------------------
  const minGapHours = 0.9;
  const remarks = [];
  log.remarks.forEach((r) => {
    if (!remarks.length || r.hour - remarks[remarks.length - 1].hour >= minGapHours) {
      remarks.push(r);
    }
  });

  return (
    <Paper
      className="log-sheet"
      variant="outlined"
      sx={{
        bgcolor: palette.paper,
        borderColor: '#D8D2C2',
        p: { xs: 2, md: 3 },
        boxShadow: '0 1px 3px rgba(29,43,54,0.12)',
      }}
    >
      {/* ----------------------------------------------------- header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        rowGap={1}
      >
        <Box>
          <Typography variant="h5" sx={{ lineHeight: 1.1 }}>
            DRIVER&apos;S DAILY LOG
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: palette.inkSoft }}>
            (ONE CALENDAR DAY — 24 HOURS)
          </Typography>
        </Box>
        <Typography variant="overline" sx={{ color: palette.signGreen, fontSize: 13 }}>
          Day {log.day_number} of {result.plan.daily_logs.length}
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={3}
        rowGap={1.25}
        flexWrap="wrap"
        useFlexGap
        sx={{ mt: 1.5, mb: 2 }}
      >
        <HeaderField
          label="Month / Day / Year"
          mono
          value={date.toLocaleDateString(undefined, {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
          })}
          width={120}
        />
        <HeaderField
          label="Total miles driving today"
          mono
          value={Math.round(log.miles_today).toLocaleString()}
          width={150}
        />
        <HeaderField label="Name of carrier" value="Spotter AI Logistics" width={180} />
        <HeaderField
          label="From → To"
          value={`${inputs.pickup_location} → ${inputs.dropoff_location}`}
          width={{ xs: '100%', sm: 280 }}
        />
      </Stack>

      {/* -------------------------------------------------------- grid */}
      <Box sx={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', minWidth: 720, display: 'block' }}
          role="img"
          aria-label={`Duty status graph for ${log.date}`}
        >
          {/* hour labels */}
          {HOUR_LABELS.map((label, i) => (
            <text
              key={i}
              x={x(i)}
              y={GY0 - 10}
              textAnchor="middle"
              fontSize="11"
              fontFamily="IBM Plex Mono"
              fill={palette.inkSoft}
            >
              {label}
            </text>
          ))}

          {/* row bands + labels + totals */}
          {ROWS.map((status, i) => (
            <g key={status}>
              <rect
                x={GX0}
                y={GY0 + i * ROW_H}
                width={GX1 - GX0}
                height={ROW_H}
                fill={i % 2 ? 'rgba(29,43,54,0.025)' : 'transparent'}
              />
              <text
                x={GX0 - 10}
                y={rowMid(i) - 4}
                textAnchor="end"
                fontSize="12"
                fontWeight="600"
                fontFamily="Barlow"
                fill={palette.ink}
              >
                {i + 1}. {STATUS_META[status].label.split(' (')[0]}
              </text>
              {status === 'on_duty' && (
                <text
                  x={GX0 - 10}
                  y={rowMid(i) + 9}
                  textAnchor="end"
                  fontSize="9.5"
                  fontFamily="Barlow"
                  fill={palette.inkSoft}
                >
                  (Not Driving)
                </text>
              )}
              <text
                x={GX1 + 12}
                y={rowMid(i) + 4}
                fontSize="14"
                fontFamily="IBM Plex Mono"
                fontWeight="500"
                fill={palette.ink}
              >
                {fmtHrs(log.totals[status])}
              </text>
            </g>
          ))}

          {/* vertical hour + quarter ticks */}
          {Array.from({ length: 25 }, (_, h) => (
            <g key={h}>
              <line
                x1={x(h)}
                y1={GY0}
                x2={x(h)}
                y2={GY1}
                stroke={palette.ink}
                strokeWidth={h % 12 === 0 ? 1.4 : 0.7}
                opacity={h % 12 === 0 ? 0.9 : 0.55}
              />
              {h < 24 &&
                [0.25, 0.5, 0.75].map((q) =>
                  ROWS.map((_, r) => (
                    <line
                      key={`${q}-${r}`}
                      x1={x(h + q)}
                      y1={GY0 + r * ROW_H}
                      x2={x(h + q)}
                      y2={GY0 + r * ROW_H + (q === 0.5 ? 9 : 5.5)}
                      stroke={palette.ink}
                      strokeWidth="0.6"
                      opacity="0.5"
                    />
                  )),
                )}
            </g>
          ))}

          {/* horizontal rules */}
          {Array.from({ length: 5 }, (_, i) => (
            <line
              key={i}
              x1={GX0}
              y1={GY0 + i * ROW_H}
              x2={GX1}
              y2={GY0 + i * ROW_H}
              stroke={palette.ink}
              strokeWidth={i === 0 || i === 4 ? 1.4 : 0.8}
            />
          ))}

          {/* the duty line — drawn in ballpoint blue */}
          <path
            d={path}
            fill="none"
            stroke={palette.dutyBlue}
            strokeWidth="2.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* totals header + 24h sum */}
          <text
            x={GX1 + 12}
            y={GY0 - 10}
            fontSize="10"
            fontFamily="Barlow"
            fontWeight="600"
            fill={palette.inkSoft}
          >
            TOTAL
          </text>
          <line
            x1={GX1 + 10}
            y1={GY1 + 6}
            x2={GX1 + 56}
            y2={GY1 + 6}
            stroke={palette.ink}
            strokeWidth="1"
          />
          <text
            x={GX1 + 12}
            y={GY1 + 22}
            fontSize="13"
            fontFamily="IBM Plex Mono"
            fontWeight="500"
            fill={palette.ink}
          >
            ={Math.round(log.total_hours)}
          </text>

          {/* ------------------------------------------------- remarks */}
          <text
            x={GX0 - 10}
            y={GY1 + 24}
            textAnchor="end"
            fontSize="12"
            fontWeight="600"
            fontFamily="Barlow"
            fill={palette.ink}
          >
            REMARKS
          </text>
          <line
            x1={GX0}
            y1={GY1 + REMARK_H}
            x2={GX1}
            y2={GY1 + REMARK_H}
            stroke={palette.ink}
            strokeWidth="0.8"
          />
          {remarks.map((r, i) => (
            <g key={i} transform={`translate(${x(r.hour)}, ${GY1 + 16})`}>
              <line x1="0" y1="-16" x2="0" y2="0" stroke={palette.dutyBlue} strokeWidth="1" opacity="0.6" />
              <text
                transform="rotate(38)"
                fontSize="10.5"
                fontFamily="Barlow"
                fill={palette.ink}
              >
                {r.text}
                {r.location && r.location.length < 46 ? ` — ${r.location.split(',').slice(0, 2).join(',')}` : ''}
              </text>
            </g>
          ))}
        </svg>
      </Box>

      {/* ------------------------------------------------------ footer */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        flexWrap="wrap"
        rowGap={1}
        sx={{ mt: 1.5 }}
      >
        <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
          {ROWS.map((s) => (
            <Stack key={s} direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: STATUS_META[s].color }} />
              <Typography sx={{ fontSize: 12, color: palette.inkSoft }}>
                {STATUS_META[s].label}: <b>{fmtHrs(log.totals[s])} h</b>
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
