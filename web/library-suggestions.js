// Suggestions are limited to real candidates seen in this page session.
export function nearbyNames(query, candidates) {
  const q = query.toLowerCase();
  if (q.length < 4 || q.length > 60) return [];
  function distance(a,b) {
    let row = Array.from({length:b.length+1}, (_,i)=>i);
    for (let i=1;i<=a.length;i++) {
      const next=[i];
      for(let j=1;j<=b.length;j++) next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));
      row=next;
    }
    return row[b.length];
  }
  const names = new Map();
  for (const p of candidates) {
    const name=p.name.toLowerCase();
    if (!names.has(name) && Math.abs(name.length-q.length)<=2) {
      const score=distance(q,name); if(score>0 && score<=2) names.set(name,{...p,score});
    }
  }
  return [...names.values()].sort((a,b)=>a.score-b.score || a.name.localeCompare(b.name)).slice(0,3);
}
