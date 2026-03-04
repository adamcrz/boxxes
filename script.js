// Minimal plan + code skeleton for your “Box” (5 teams of 2, round robin, Elo per player)

/* -------------------- CONFIG -------------------- */
const K_DEFAULT = 24; // Elo K-factor (tune later)

/* -------------------- CORE TYPES -------------------- */
// player: { id, name, elo }
// team: { id, players: [p1Id, p2Id] }
// match: { id, teamAId, teamBId, scoreA, scoreB } // score = games won (padel-style)
 // box: { id, clubId, courtId, teams: [team], matches: [match] }

/* -------------------- ROUND ROBIN SCHEDULE (5 teams => 10 matches) -------------------- */
function generateRoundRobinMatches(teamIds) {
  const matches = [];
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matches.push({
        id: `${teamIds[i]}_vs_${teamIds[j]}`,
        teamAId: teamIds[i],
        teamBId: teamIds[j],
        scoreA: null,
        scoreB: null
      });
    }
  }
  return matches; // length = n*(n-1)/2
}

/* -------------------- STANDINGS (wins, points) -------------------- */
function computeStandings(box) {
  const table = new Map();
  for (const t of box.teams) {
    table.set(t.id, { teamId: t.id, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 });
  }

  for (const m of box.matches) {
    if (m.scoreA == null || m.scoreB == null) continue;

    const A = table.get(m.teamAId);
    const B = table.get(m.teamBId);

    A.pointsFor += m.scoreA;   A.pointsAgainst += m.scoreB;
    B.pointsFor += m.scoreB;   B.pointsAgainst += m.scoreA;

    if (m.scoreA > m.scoreB) { A.wins++; B.losses++; }
    else if (m.scoreB > m.scoreA) { B.wins++; A.losses++; }
    // if tie allowed, handle here (padel usually no tie; remove if not needed)
  }

  return [...table.values()].sort((x, y) =>
    (y.wins - x.wins) || ((y.pointsFor - y.pointsAgainst) - (x.pointsFor - x.pointsAgainst))
  );
}

/* -------------------- ELO (TEAM EXPECTATION FROM PLAYER ELOS) -------------------- */
function expectedScore(eloA, eloB) {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

// team rating = average of its players (simple + common)
function teamElo(team, playersById) {
  const [p1, p2] = team.players.map(id => playersById.get(id));
  return (p1.elo + p2.elo) / 2;
}

/* -------------------- APPLY ONE MATCH RESULT TO PLAYER ELOS -------------------- */
/*
  match result:
   - win/loss based on scoreA vs scoreB
   - optional: margin multiplier (games difference) to weight big wins more
*/
function updateEloFromMatch({ box, matchId, playersById, k = K_DEFAULT, useMargin = true }) {
  const match = box.matches.find(m => m.id === matchId);
  if (!match || match.scoreA == null || match.scoreB == null) return;

  const teamA = box.teams.find(t => t.id === match.teamAId);
  const teamB = box.teams.find(t => t.id === match.teamBId);

  const ra = teamElo(teamA, playersById);
  const rb = teamElo(teamB, playersById);

  const ea = expectedScore(ra, rb);
  const eb = 1 - ea;

  const sa = match.scoreA > match.scoreB ? 1 : 0;
  const sb = 1 - sa;

  let mult = 1;
  if (useMargin) {
    const diff = Math.abs(match.scoreA - match.scoreB);
    // small, stable weighting; tune later
    mult = 1 + Math.min(0.75, diff / 10);
  }

  const deltaA = k * mult * (sa - ea);
  const deltaB = k * mult * (sb - eb);

  // split team delta equally to each player (simple + fair baseline)
  for (const pid of teamA.players) playersById.get(pid).elo += deltaA / 2;
  for (const pid of teamB.players) playersById.get(pid).elo += deltaB / 2;
}

/* -------------------- RUN FULL BOX: update after all matches -------------------- */
function updateEloForCompletedBox({ box, playersById, k = K_DEFAULT }) {
  for (const m of box.matches) {
    if (m.scoreA == null || m.scoreB == null) continue;
    updateEloFromMatch({ box, matchId: m.id, playersById, k });
  }
}

/* -------------------- QUICK CREATE BOX -------------------- */
function createBox({ id, clubId, courtId, teams }) {
  const teamIds = teams.map(t => t.id);
  return {
    id, clubId, courtId,
    teams,
    matches: generateRoundRobinMatches(teamIds)
  };
}
// Example minimal usage (paste into a test.js)

const playersById = new Map([
  ["p1", { id:"p1", name:"A", elo:1200 }],
  ["p2", { id:"p2", name:"B", elo:1200 }],
  ["p3", { id:"p3", name:"C", elo:1200 }],
  ["p4", { id:"p4", name:"D", elo:1200 }],
  ["p5", { id:"p5", name:"E", elo:1200 }],
  ["p6", { id:"p6", name:"F", elo:1200 }],
  ["p7", { id:"p7", name:"G", elo:1200 }],
  ["p8", { id:"p8", name:"H", elo:1200 }],
  ["p9", { id:"p9", name:"I", elo:1200 }],
  ["p10",{ id:"p10",name:"J", elo:1200 }],
]);

const teams = [
  { id:"t1", players:["p1","p2"] },
  { id:"t2", players:["p3","p4"] },
  { id:"t3", players:["p5","p6"] },
  { id:"t4", players:["p7","p8"] },
  { id:"t5", players:["p9","p10"] },
];

const box = createBox({ id:"box1", clubId:"clubZ", courtId:"court1", teams });

// enter results (games won)
box.matches[0].scoreA = 6; box.matches[0].scoreB = 3;
box.matches[1].scoreA = 6; box.matches[1].scoreB = 4;
// ... fill all 10 matches

updateEloForCompletedBox({ box, playersById, k: 24 });

console.log([...playersById.values()].map(p => ({ name:p.name, elo: Math.round(p.elo) })));
console.log(computeStandings(box));