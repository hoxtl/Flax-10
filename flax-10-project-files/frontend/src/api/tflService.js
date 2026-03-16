const TFL_API_KEY = import.meta.env.VITE_TFL_API_KEY;
const TFL_BASE = 'https://api.tfl.gov.uk';


export const tflService = {
    /**
     * Journey planner using TfL public transport modes.
     */
    async journeyPlanner(fromLat, fromLng, toLat, toLng) {
        try {
            const tfl_url = `${TFL_BASE}/Journey/JourneyResults/${fromLat},${fromLng}/to/${toLat},${toLng}?app_key=${TFL_API_KEY}`;
            const response = await fetch(tfl_url);

            if (!response.ok) {
                throw new Error(`TfL API error: ${response.status}`);
            }

            const data = await response.json();
            if (!data.journeys || data.journeys.length == 0) {
                return null;
            }

            const fastest_journey = data.journeys[0];

            return {
                duration: fastest_journey.duration,
                legs: fastest_journey.legs.map(leg => ({
                    mode: leg.mode.name,
                    duration: leg.duration,
                    instruction: leg.instruction?.summary || '',
                    departurePoint: leg.departurePoint?.commonName || '',
                    arrivalPoint: leg.arrivalPoint?.commonName || '',
                    routeOptions: leg.routeOptions?.map(opt => ({
                        name: opt.name,
                        lineIdentifier: opt.lineIdentifier,
                    })) || [],
                    path: leg.path?.lineString ? this.decodeTfLPolyline(leg.path.lineString) : null
                })),
            };
        }
        catch (error) {
            console.error('TFL API journeyPlanner error: ', error);
            throw error;
        }
    },

    /**
     * TfL polyline decoder to return coordinates.
     */
    decodeTfLPolyline(encoded) {
        if (!encoded) return [];
    
        const poly = [];
        let index = 0;
        let lat = 0;
        let lng = 0;

        while (index < encoded.length) {
        let b;
        let shift = 0;
        let result = 0;
        
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        poly.push([lng / 1e5, lat / 1e5]);
        }

        return poly;
    },

    /**
     * Getter method to return current TfL service disruptions/delays.
     * Response feeds getRelevantDelays / getContextualTravelAlert for the Right Now widget and contextual travel alerts.
     */
    async getTfLDelays() {
        try {
            const transport_modes = ['tube', 'dlr', 'overground', 'elizabeth-line', 'tram'];
            const url = `${TFL_BASE}/Line/Mode/${transport_modes.join(',')}/Status?app_key=${TFL_API_KEY}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`TFL Delays API error: ${response.status}`);
            }

            const data = await response.json();

            const delays = [];

            data.forEach(line => {
                line.lineStatuses.forEach(status => {
                    if (status.statusSeverity < 10) {
                        delays.push({
                            lineName: line.name,
                            mode: line.modeName,
                            severity: status.statusSeverity,
                            severityDescription: status.statusSeverityDescription,
                            reason: status.reason || 'Service Delay/Disruption',
                            color: this.getDelayLineColor(line.id),
                        });
                    }
                });
            });
            return delays;
        } catch (error) {
            console.error('TFL Delay Service API error: ', error);
            return [];
        }
    },

    /**
     * Getter method to return TfL line colours for display
     */
    getDelayLineColor(lineId) {
        const colors = {
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
        return colors[lineId] || '#a5a5a5ff';
    },
}
