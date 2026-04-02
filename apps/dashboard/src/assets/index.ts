import _bgLobby from './bg-lobby.svg';
import _dashboardBg from './dashboard-bg.png';
import _zoWorldIcon from './zo-world-icon.gif';
import _zoSpinner from './zo-spinner.gif';
import _countryIndia from './Country-card_India.gif';
import _countrySpain from './Country-Cards_Spain.gif';
import _countryFrance from './Country-Cards_France.gif';
import _countryJapan from './Country-Cards_Japan.gif';
import _countryRussia from './Country-Cards_Russia.gif';
import _countryElSalvador from './Country-Cards_El-Salvador.gif';

// In dev, imports resolve to /dashboard/dashboard-assets/file (from public/)
// In prod, imports resolve to /_next/static/media/file.hash.ext (bundled by webpack)
export const bgLobby: string = _bgLobby;
export const dashboardBg: string = _dashboardBg;
export const zoWorldIcon: string = _zoWorldIcon;
export const zoSpinner: string = _zoSpinner;
export const countryIndia: string = _countryIndia;
export const countrySpain: string = _countrySpain;
export const countryFrance: string = _countryFrance;
export const countryJapan: string = _countryJapan;
export const countryRussia: string = _countryRussia;
export const countryElSalvador: string = _countryElSalvador;
