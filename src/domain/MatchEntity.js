/**
 * Converts a provider kickoff value into a millisecond epoch string.
 * Accepts ISO strings, second epochs, and millisecond epochs. Returns '' when unknown.
 */
function toMillis(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return '';
    return Math.round(value < 1e12 ? value * 1000 : value).toString();
  }
  const str = String(value).trim();
  if (str === '' || str === '0') return '';
  const numeric = Number(str);
  if (Number.isFinite(numeric)) {
    if (numeric <= 0) return '';
    return Math.round(numeric < 1e12 ? numeric * 1000 : numeric).toString();
  }
  const t = new Date(str).getTime();
  return Number.isFinite(t) && t > 0 ? t.toString() : '';
}

class MatchEntity {
  constructor({ id, title, category, date, timestamp, status, popular, sources, league, team1, team2, thumbnail_url }) {
    this.id = id || '';
    this.title = title || 'Unknown Match';
    this.category = category || 'other';
    this.date = toMillis(timestamp !== null && timestamp !== undefined ? timestamp : date);
    this.status = status || '';
    this.popular = popular === '1' || popular === true ? '1' : '0';
    this.sources = Array.isArray(sources) ? sources : [];
    
    if (league && typeof league === 'object' && !Array.isArray(league)) {
      this.league = league.name || league.title || '';
    } else {
      this.league = league ? String(league) : '';
    }
    
    this.team1 = team1 || null;
    this.team2 = team2 || null;
    this.thumbnail_url = thumbnail_url || '';
  }
}

module.exports = MatchEntity;
