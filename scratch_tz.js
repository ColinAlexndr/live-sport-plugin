function parseWithTimezone(dateString, timeZone) {
  const cleanStr = dateString.trim().replace(' ', 'T');
  const localDate = new Date(cleanStr + 'Z'); 
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(localDate);
  const p = {};
  parts.forEach(part => { p[part.type] = part.value; });
  
  // Sometimes hour can be 24, Intl can format midnight as 24:00:00
  let hour = parseInt(p.hour, 10);
  if (hour === 24) hour = 0;
  const hourStr = hour.toString().padStart(2, '0');
  
  const formattedStr = `${p.year}-${p.month}-${p.day}T${hourStr}:${p.minute}:${p.second}Z`;
  const formattedDate = new Date(formattedStr);
  
  const offsetMs = localDate.getTime() - formattedDate.getTime();
  return localDate.getTime() + offsetMs;
}

const ts1 = parseWithTimezone("2026-08-16T16:05", "America/New_York");
console.log("TimStreams (EDT):", new Date(ts1).toISOString(), "-> Expected UTC: 2026-08-16T20:05:00.000Z");

const ts2 = parseWithTimezone("2026-01-16T16:05", "America/New_York");
console.log("TimStreams (EST):", new Date(ts2).toISOString(), "-> Expected UTC: 2026-01-16T21:05:00.000Z");
