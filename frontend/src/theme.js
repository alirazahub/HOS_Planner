import { createTheme } from '@mui/material/styles';

/**
 * Design system grounded in the subject: US highway vernacular.
 *  - pine / signGreen ......... interstate guide-sign green
 *  - amber ..................... hazard / work-zone amber (signature accent)
 *  - paper / ink ............... the FMCSA paper daily log
 *  - dutyBlue .................. ballpoint ink used to draw the duty line
 * Type: Barlow Condensed (drawn from US highway-sign lettering) for
 * display, Barlow for body, IBM Plex Mono for times, miles and coords.
 */
export const palette = {
  pine: '#0E2A23',
  pineSoft: '#16382F',
  signGreen: '#1B6E53',
  amber: '#F2B705',
  amberDark: '#C79400',
  paper: '#FAF7F0',
  ink: '#1D2B36',
  inkSoft: '#54677A',
  line: '#E3DDD0',
  dutyBlue: '#2456A6',
  status: {
    off_duty: '#94A3B8',
    sleeper: '#7C6FBF',
    driving: '#E8A200',
    on_duty: '#2F8F6B',
  },
};

export const STATUS_META = {
  off_duty: { label: 'Off Duty', short: 'OFF', color: palette.status.off_duty },
  sleeper: { label: 'Sleeper Berth', short: 'SB', color: palette.status.sleeper },
  driving: { label: 'Driving', short: 'D', color: palette.status.driving },
  on_duty: { label: 'On Duty (Not Driving)', short: 'ON', color: palette.status.on_duty },
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: palette.signGreen, dark: '#14523E', contrastText: '#fff' },
    secondary: { main: palette.amber, contrastText: palette.pine },
    background: { default: '#F2EFE7', paper: '#FFFFFF' },
    text: { primary: palette.ink, secondary: palette.inkSoft },
    divider: palette.line,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Barlow", system-ui, sans-serif',
    h1: { fontFamily: '"Barlow Condensed"', fontWeight: 700, letterSpacing: '0.01em' },
    h2: { fontFamily: '"Barlow Condensed"', fontWeight: 700 },
    h3: { fontFamily: '"Barlow Condensed"', fontWeight: 700 },
    h4: { fontFamily: '"Barlow Condensed"', fontWeight: 700 },
    h5: { fontFamily: '"Barlow Condensed"', fontWeight: 600 },
    h6: { fontFamily: '"Barlow Condensed"', fontWeight: 600, letterSpacing: '0.02em' },
    overline: { fontFamily: '"Barlow Condensed"', fontWeight: 600, letterSpacing: '0.14em' },
    button: { fontFamily: '"Barlow Condensed"', fontWeight: 600, letterSpacing: '0.06em', fontSize: '1rem' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'uppercase', borderRadius: 8 },
      },
    },
    MuiChip: {
      styleOverrides: {
        label: { fontFamily: '"Barlow"', fontWeight: 600 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
  },
});

export default theme;
