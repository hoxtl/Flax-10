/*
 * TfL journey planner and service disruption API client.
 */

<<<<<<< HEAD
import tflLineColors from './tflLineColors.json';

const TFL_API_KEY = import.meta.env.VITE_TFL_API_KEY;
const TFL_BASE = 'https://api.tfl.gov.uk';

const LINE_COLOURS = tflLineColors.lineColours;
const FALLBACK_COLOUR = tflLineColors.fallbackColour;
=======
const TFL_API_KEY = import.meta.env.VITE_TFL_API_KEY;
const TFL_BASE = 'https://api.tfl.gov.uk';

const LINE_COLOURS = {
  'bakerloo': '#B36305',
  'central': '#E32017',
  'circle': '#FFD300',
  'district': '#00782A',
  'hammersmith-city': '#F3A9BB',
  'jubilee': '#A0A5A9',
  'metropolitan': '#9B0056',
  'northern': '#000000',
  'piccadilly': '#003688',
  'victoria': '#0098D4',
  'waterloo-city': '#95CDBA',
  'elizabeth': '#7156A5',
  'dlr': '#00A4A7',
  'london-overground': '#EE7C0E',
  'tram': '#84B817',
};
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

function mapLeg(leg, decoder) {
  return {
    mode: leg.mode.name,
    duration: leg.duration,
    instruction: leg.instruction?.summary || '',
    departurePoint: leg.departurePoint?.commonName || '',
    arrivalPoint: leg.arrivalPoint?.commonName || '',
    routeOptions: (leg.routeOptions || []).map(opt => ({ name: opt.name, lineIdentifier: opt.lineIdentifier })),
    path: leg.path?.lineString ? decoder(leg.path.lineString) : null,
  };
}

function parseJourney(data, decoder) {
  if (!data.journeys?.length) return null;
  const fastest = data.journeys[0];
  return { duration: fastest.duration, legs: fastest.legs.map(leg => mapLeg(leg, decoder)) };
}

function decodeNextCoord(encoded, index) {
  let b, shift = 0, result = 0;
  do {
    b = encoded.charCodeAt(index++) - 63;
    result |= (b & 0x1f) << shift;
    shift += 5;
  } while (b >= 0x20);
  const value = (result & 1) ? ~(result >> 1) : (result >> 1);
  return { value, index };
}

<<<<<<< HEAD
function buildDelay(line, status) {
  return {
    lineName: line.name,
    mode: line.modeName,
    severity: status.statusSeverity,
    severityDescription: status.statusSeverityDescription,
    reason: status.reason || 'Service Delay/Disruption',
    color: LINE_COLOURS[line.id] || FALLBACK_COLOUR,
  };
}

function extractLineDelays(line) {
  return line.lineStatuses.filter((s) => s.statusSeverity < 10).map((s) => buildDelay(line, s));
}

function extractDelays(lines) {
  return lines.flatMap(extractLineDelays);
=======
function extractDelays(lines) {
  const delays = [];
  for (const line of lines) {
    for (const status of line.lineStatuses) {
      if (status.statusSeverity >= 10) continue;
      delays.push({
        lineName: line.name,
        mode: line.modeName,
        severity: status.statusSeverity,
        severityDescription: status.statusSeverityDescription,
        reason: status.reason || 'Service Delay/Disruption',
        color: LINE_COLOURS[line.id] || '#a5a5a5ff',
      });
    }
  }
  return delays;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

export const tflService = {
  async journeyPlanner(fromLat, fromLng, toLat, toLng) {
    try {
      const url = `${TFL_BASE}/Journey/JourneyResults/${fromLat},${fromLng}/to/${toLat},${toLng}?app_key=${TFL_API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`TfL API error: ${response.status}`);
      return parseJourney(await response.json(), this.decodeTfLPolyline);
    } catch (error) {
<<<<<<< HEAD
=======
      console.error('TfL API journeyPlanner error: ', error);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      throw error;
    }
  },

  decodeTfLPolyline(encoded) {
    if (!encoded) return [];
    const poly = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
      const dLat = decodeNextCoord(encoded, index);
      lat += dLat.value;
      index = dLat.index;
      const dLng = decodeNextCoord(encoded, index);
      lng += dLng.value;
      index = dLng.index;
      poly.push([lng / 1e5, lat / 1e5]);
    }
    return poly;
  },

  async getTfLDelays() {
    try {
      const modes = ['tube', 'dlr', 'overground', 'elizabeth-line', 'tram'];
      const url = `${TFL_BASE}/Line/Mode/${modes.join(',')}/Status?app_key=${TFL_API_KEY}`;
      const response = await fetch(url);
<<<<<<< HEAD
      if (response.status === 429) return [];
      if (!response.ok) throw new Error(`TfL Delays API error: ${response.status}`);
      return extractDelays(await response.json());
    } catch {
=======
      if (response.status === 429) { console.warn('TfL API: Rate limited (429)'); return []; }
      if (!response.ok) throw new Error(`TfL Delays API error: ${response.status}`);
      return extractDelays(await response.json());
    } catch (error) {
      console.error('TfL Delay API error: ', error);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      return [];
    }
  },

  getDelayLineColor(lineId) {
<<<<<<< HEAD
    return LINE_COLOURS[lineId] || FALLBACK_COLOUR;
=======
    return LINE_COLOURS[lineId] || '#a5a5a5ff';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  },
};
