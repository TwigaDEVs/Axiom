"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportsResultFetcher = void 0;
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
/**
 * Map sport names to ESPN path segments.
 */
const SPORT_MAP = {
    nba: { sport: "basketball", league: "nba" },
    nfl: { sport: "football", league: "nfl" },
    mlb: { sport: "baseball", league: "mlb" },
    nhl: { sport: "hockey", league: "nhl" },
    epl: { sport: "soccer", league: "eng.1" },
    "premier league": { sport: "soccer", league: "eng.1" },
    "la liga": { sport: "soccer", league: "esp.1" },
    "serie a": { sport: "soccer", league: "ita.1" },
    bundesliga: { sport: "soccer", league: "ger.1" },
    mls: { sport: "soccer", league: "usa.1" },
};
/**
 * Normalize team names for fuzzy matching.
 */
function normalizeTeam(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function teamsMatch(espnName, queryName) {
    const a = normalizeTeam(espnName);
    const b = normalizeTeam(queryName);
    return a.includes(b) || b.includes(a);
}
class SportsResultFetcher {
    /**
     * Fetch scoreboard for a specific date and find the matching game.
     */
    async fetch(spec) {
        try {
            const sport = (spec.sport || "basketball").toLowerCase();
            const competition = (spec.competition || "nba").toLowerCase();
            const teamA = spec.team_a || "";
            const teamB = spec.team_b || "";
            const eventDate = spec.event_date || "";
            // Find ESPN path
            const mapping = SPORT_MAP[competition] ||
                SPORT_MAP[sport] ||
                { sport: "basketball", league: "nba" };
            // Format date for ESPN: YYYYMMDD
            const dateStr = eventDate.replace(/-/g, "").slice(0, 8);
            const url = `${ESPN_BASE}/${mapping.sport}/${mapping.league}/scoreboard?dates=${dateStr}`;
            const resp = await fetch(url);
            if (!resp.ok) {
                return {
                    success: false,
                    data: {},
                    source: "espn",
                    fetched_at: new Date().toISOString(),
                    error: `ESPN API error: ${resp.status}`,
                };
            }
            const data = (await resp.json());
            const events = data.events || [];
            // Find the matching game
            let matchedGame = null;
            for (const event of events) {
                const competitors = event.competitions?.[0]?.competitors || [];
                if (competitors.length < 2)
                    continue;
                const home = competitors.find((c) => c.homeAway === "home");
                const away = competitors.find((c) => c.homeAway === "away");
                if (!home || !away)
                    continue;
                const homeName = home.team?.displayName || home.team?.name || "";
                const awayName = away.team?.displayName || away.team?.name || "";
                const matchesA = teamsMatch(homeName, teamA) || teamsMatch(awayName, teamA);
                const matchesB = teamsMatch(homeName, teamB) || teamsMatch(awayName, teamB);
                if (matchesA && matchesB) {
                    matchedGame = {
                        event_id: event.id,
                        event_name: event.name,
                        status: event.status?.type?.name,
                        status_detail: event.status?.type?.description,
                        completed: event.status?.type?.completed || false,
                        home_team: homeName,
                        away_team: awayName,
                        home_score: parseInt(home.score || "0"),
                        away_score: parseInt(away.score || "0"),
                        winner: parseInt(home.score || "0") > parseInt(away.score || "0")
                            ? homeName
                            : parseInt(away.score || "0") > parseInt(home.score || "0")
                                ? awayName
                                : "DRAW",
                    };
                    break;
                }
            }
            if (!matchedGame) {
                return {
                    success: false,
                    data: {
                        events_on_date: events.length,
                        searched_teams: [teamA, teamB],
                        date_searched: dateStr,
                    },
                    source: "espn",
                    fetched_at: new Date().toISOString(),
                    error: `No matching game found for ${teamA} vs ${teamB} on ${dateStr}`,
                };
            }
            return {
                success: true,
                data: matchedGame,
                source: "espn",
                fetched_at: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                success: false,
                data: {},
                source: "espn",
                fetched_at: new Date().toISOString(),
                error: `Fetch failed: ${error}`,
            };
        }
    }
}
exports.SportsResultFetcher = SportsResultFetcher;
//# sourceMappingURL=sports-result.js.map