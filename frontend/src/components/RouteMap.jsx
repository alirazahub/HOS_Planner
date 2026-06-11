import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import L from 'leaflet';
import { useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';

import { palette } from '../theme.js';

const STOP_STYLE = {
  start: { color: palette.pine, glyph: '▶', name: 'Start' },
  pickup: { color: palette.signGreen, glyph: '↑', name: 'Pickup' },
  dropoff: { color: '#B3402A', glyph: '⚑', name: 'Drop-off' },
  fuel: { color: palette.amberDark, glyph: '⛽', name: 'Fuel' },
  break: { color: '#5B8DB8', glyph: '☕', name: '30-min break' },
  rest: { color: palette.status.sleeper, glyph: '☾', name: '10-hr rest' },
  restart: { color: '#7A4FA0', glyph: '↺', name: '34-hr restart' },
};

const icon = (kind) => {
  const s = STOP_STYLE[kind] || STOP_STYLE.break;
  return L.divIcon({
    className: '',
    html: `<div class="stop-marker" style="background:${s.color}">${s.glyph}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const fmtTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function RouteMap({ result }) {
  const geometry = result.route.geometry;
  const stops = result.plan.stops.filter((s) => s.lat != null && s.lng != null);

  const bounds = useMemo(() => L.latLngBounds(geometry), [geometry]);
  const legendKinds = useMemo(
    () => [...new Set(stops.map((s) => s.kind))],
    [stops],
  );

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', borderColor: palette.line }}>
      <Stack
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        spacing={1}
        useFlexGap
        sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${palette.line}` }}
        className="no-print"
      >
        <Typography variant="h6" sx={{ mr: 1 }}>
          Route &amp; scheduled stops
        </Typography>
        {legendKinds.map((k) => (
          <Chip
            key={k}
            size="small"
            label={STOP_STYLE[k].name}
            sx={{
              bgcolor: `${STOP_STYLE[k].color}1A`,
              color: STOP_STYLE[k].color,
              fontWeight: 700,
            }}
          />
        ))}
      </Stack>
      <Box sx={{ height: { xs: 380, md: 480 } }}>
        <MapContainer
          bounds={bounds}
          boundsOptions={{ padding: [40, 40] }}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline
            positions={geometry}
            pathOptions={{ color: palette.pine, weight: 6, opacity: 0.35 }}
          />
          <Polyline
            positions={geometry}
            pathOptions={{ color: palette.signGreen, weight: 3.5 }}
          />
          {stops.map((s, i) => (
            <Marker key={i} position={[s.lat, s.lng]} icon={icon(s.kind)}>
              <Popup>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{s.label}</Typography>
                <Typography sx={{ fontSize: 13 }}>{fmtTime(s.time)}</Typography>
                <Typography sx={{ fontSize: 12.5, color: palette.inkSoft }}>
                  Mile {Math.round(s.mile_marker).toLocaleString()}
                  {s.duration_hours > 0 && ` · ${s.duration_hours} h stop`}
                </Typography>
                {s.location && (
                  <Typography sx={{ fontSize: 12, color: palette.inkSoft, mt: 0.5 }}>
                    {s.location}
                  </Typography>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Paper>
  );
}
