import Fuse from 'https://unpkg.com/fuse.js@6.6.2/dist/fuse.esm.min.js';

export default function useFuzzyMatch() {
  function extractRegion(s) {
    if (!s) return { label: '', region: null };
    // Match common region tags like (USA), (EUR), (JPN), (PAL), (NTSC), etc.
    const regionMatch = s.match(/\((USA|EUR|Europe|JP|JPN|Japan|PAL|NTSC|KOR|Korea|AUS|Australia|Brazil|BRA|CN|China|Unl|World|Japan|Rev-[A-Z0-9]|v\d+(?:\.\d+)?)\)(?=\s*$|\s*\()/i);
    if (regionMatch) {
      const region = regionMatch[1].toUpperCase();
      const label = s.substring(0, regionMatch.index).trim();
      return { label, region };
    }
    return { label: s, region: null };
  }

  function sanitizeLabel(s) {
    if (!s) return '';
    let out = s;
    // remove file extensions
    out = out.replace(/\.[^.]*$/i, '');
    // remove parentheses tags like (USA) (En,Ja)
    out = out.replace(/\([^\)]*\)/g, '');
    // remove [!], [v1.1], etc
    out = out.replace(/\[[^\]]*\]/g, '');
    // collapse whitespace
    out = out.replace(/\s+/g, ' ').trim();
    return out;
  }

  async function fetchDatNames(systemName) {
    // Use system name directly from the list (already correct from libretro-database)
    const normalizedName = systemName;
    
    const candidates = [
      `metadat/no-intro/${normalizedName}.dat`
    ].map(p => `https://cdn.jsdelivr.net/gh/libretro/libretro-database@master/${encodeURIComponent(p)}`);

    let resp = null;
    let txt = '';
    const tried = [];
    for (const url of candidates) {
      // jsDelivr encoded path may double-encode spaces; ensure proper encoding of filename only
      const fixedUrl = url.replace(/%2F/g, '/').replace(/%2520/g, '%20');
      tried.push(fixedUrl);
      try {
        resp = await fetch(fixedUrl);
        if (resp && resp.ok) {
          txt = await resp.text();
          break;
        }
      } catch (err) {
        // continue to next candidate
      }
    }
    if (!txt) throw new Error(`Não foi possível carregar a database do sistema. URLs tentadas: ${tried.join(', ')}`);
    const gameNameRegex = /game\s*\([\s\S]*?name\s*"([^\"]+)"/gi;
    const names = [];
    let m;
    while ((m = gameNameRegex.exec(txt)) !== null) {
      names.push(m[1]);
    }
    return names;
  }

  async function fetchRdbNames(systemName) {
    return fetchDatNames(systemName);
  }

  function matchLabel(label, nameList, threshold = 0.65) {
    if (!label || !nameList || nameList.length === 0) return null;
    
    const { label: cleanLabel, region: userRegion } = extractRegion(label);
    const sanitized = sanitizeLabel(cleanLabel);
    
    const fuse = new Fuse(nameList, { includeScore: true, isCaseSensitive: false, findAllMatches: false });
    const results = fuse.search(sanitized, { limit: 10 });
    
    if (!results || results.length === 0) return null;
    
    // If user has a region tag, try to find a match with the same region
    if (userRegion) {
      const regionMatches = results.filter(r => {
        const resultRegion = extractRegion(r.item).region;
        return resultRegion && resultRegion === userRegion;
      });
      
      if (regionMatches.length > 0) {
        const best = regionMatches[0];
        const confidence = 1 - (best.score || 1);
        if (confidence >= threshold) {
          return { best: best.item, score: confidence };
        }
      }
    }
    
    // If no region match found or user has no region, use best overall match
    const best = results[0];
    const confidence = 1 - (best.score || 1);
    if (confidence >= threshold) {
      return { best: best.item, score: confidence };
    }
    
    return null;
  }

  return { sanitizeLabel, fetchDatNames, fetchRdbNames, matchLabel, extractRegion };
}
