# Padel Box Tournament System

Algorithmic specification for a **Padel Box competition system** designed for a mobile application (Expo / React Native).

The system allows players to:

- Subscribe to clubs
- Join **Box tournaments**
- Play **round-robin matches**
- Receive **rankings**
- Gain or lose **ELO points**

Each Box contains:

- 10 players
- 5 teams (2 players each)
- Round robin tournament
- 10 matches total

---

# Table of Contents

1. System Overview  
2. Core Entities (Data Model)  
3. Box Lifecycle  
4. Core Algorithms  
5. Match Scoring System  
6. Ranking Algorithm  
7. ELO Rating System  
8. Additional Functionalities  
9. Edge Cases  
10. Example System Flow  
11. Future Improvements  

---

# 1. System Overview

A **Box** is a mini tournament played at a specific club.

Structure:

```
Box
 ├── 10 Players
 ├── 5 Teams (2 players each)
 ├── Round Robin Tournament
 └── 10 Matches
```

Each team plays **every other team once**.

Number of matches:

```
C(5,2) = 10
```

Match points:

| Result | Points |
|------|------|
| Win | 2 |
| Draw | 1 |
| Loss | 0 |

After all matches:

1. Teams are ranked
2. Players receive **ELO updates**

---

# 2. Core Entities (Data Model)

## Player

```
Player {
    id: string
    name: string
    elo: number
    clubSubscriptions: ClubSubscription[]
}
```

Description:

- Represents an individual player
- Each player has a personal **ELO rating**
- Can subscribe to clubs

---

## ClubSubscription

```
ClubSubscription {
    clubId: string
    startDate: Date
    endDate: Date | null
}
```

Rules:

- Player can subscribe to **maximum two clubs simultaneously**
- Minimum membership duration = **1 month**

---

## Club

```
Club {
    id: string
    name: string
    clubLevel: number
    boxes: Box[]
}
```

`clubLevel` influences the **ELO multiplier**.

Example:

```
Small club → multiplier 0.9
Normal club → multiplier 1.0
Premium club → multiplier 1.1
```

---

## Box

A Box is a scheduled tournament.

```
Box {
    id: string
    clubId: string
    boxLevel: number

    startTime: Date
    endTime: Date

    capacity: 10

    status:
        OPEN
        LOCKED
        RUNNING
        FINISHED
        CANCELED

    players: Player[]
    teams: Team[]
    matches: Match[]
}
```

Key rules:

- Maximum **10 players**
- Teams generated after box locks
- Matches generated automatically

---

## Team

```
Team {
    id: string
    player1: Player
    player2: Player
}
```

Teams remain **fixed throughout the tournament**.

---

## Match

```
Match {
    id: string
    teamA: Team
    teamB: Team

    scoreA: number
    scoreB: number

    status:
        SCHEDULED
        PLAYED
        FORFEIT
}
```

---

# 3. Box Lifecycle

The box behaves like a **state machine**.

```
OPEN → LOCKED → RUNNING → FINISHED
           ↘
          CANCELED
```

---

## OPEN

Box created and accepting players.

Conditions:

```
players.length ≤ 10
```

Allowed actions:

- join box
- leave box
- invite players

---

## LOCKED

Occurs when:

```
players.length = 10
```

Actions:

1. Teams generated
2. Matches generated

Players **cannot join or leave anymore**.

---

## RUNNING

Tournament is active.

Allowed actions:

- record match results
- add substitutes
- handle forfeits

---

## FINISHED

All matches completed.

System performs:

- standings calculation
- ELO update
- chat archive

---

# 4. Core Algorithms

## Creating a Box

```
createBox(clubId, boxLevel, startTime)
```

Steps:

1. Validate club exists
2. Set:

```
capacity = 10
status = OPEN
```

Initialize:

```
players = []
teams = []
matches = []
```

---

## Joining a Box

```
joinBox(boxId, playerId)
```

Validation:

```
box.status == OPEN
players < 10
player not already registered
player subscribed to club
```

Action:

```
box.players.push(player)
```

If:

```
players == 10
```

Then:

```
lockBox()
```

---

## Locking the Box

```
lockBox(boxId)
```

Steps:

1. Status → LOCKED
2. Generate teams
3. Generate matches

---

## Team Generation

### Option 1 — Random Pairing

```
shuffle(players)

teams = [
 (p1,p2),
 (p3,p4),
 (p5,p6),
 (p7,p8),
 (p9,p10)
]
```

---

### Option 2 — Balanced by ELO (recommended)

1. Sort players by ELO

```
players.sort(descending)
```

2. Pair strongest with weakest

```
team1 = (p1, p10)
team2 = (p2, p9)
team3 = (p3, p8)
team4 = (p4, p7)
team5 = (p5, p6)
```

This balances teams.

---

# 5. Match Generation

For **5 teams**, generate all combinations.

Algorithm:

```
for i = 0..4
   for j = i+1..4
        createMatch(team[i], team[j])
```

Matches generated:

```
10
```

---

# 6. Match Result Algorithm

```
recordMatch(matchId, scoreA, scoreB)
```

Steps:

1. Validate match not played
2. Save scores
3. Set match status = PLAYED

---

## Points Calculation

```
if scoreA > scoreB
   teamA += 2

if scoreA < scoreB
   teamB += 2

if scoreA == scoreB
   teamA += 1
   teamB += 1
```

---

# 7. Standings Calculation

For each team compute:

```
MP = matches played
W = wins
D = draws
L = losses
PTS = total points
```

---

## Ranking Rules

Teams sorted by:

1. Points
2. Goal difference
3. Goals scored
4. Head-to-head
5. Random tie-break

---

# 8. ELO Rating System

Each team receives ELO adjustment based on final rank.

Example base rewards:

| Rank | ELO Change |
|----|----|
| 1 | +40 |
| 2 | +20 |
| 3 | +5 |
| 4 | -10 |
| 5 | -25 |

---

## ELO Formula

```
delta =
baseRankPoints
× clubLevelMultiplier
× boxLevelMultiplier
```

Example:

```
delta = 40 × 1.1 × 1.05
```

Then apply to each player:

```
player.elo += delta
```

Both players on the team receive the same adjustment.

---

# 9. Additional Functionalities

## Club Subscription

Rules:

```
maxClubs = 2
minimumDuration = 1 month
```

Functions:

```
subscribeToClub()
unsubscribeFromClub()
```

---

## Box Reservation

Players can reserve boxes.

```
reserveBox(playerId, clubId, date)
```

---

## Player Invitations

```
invitePlayer(boxId, playerId)
```

Creates an invitation notification.

---

## Chat System

Each box has its own chat.

```
BoxChat {
    boxId
    messages[]
}
```

Only players participating in the box can access the chat.

---

## No-Show Handling

If a team does not show up:

```
match.status = FORFEIT
```

Opponent automatically receives win.

Points:

```
2 points → opponent
0 points → absent team
```

---

## Substitute Player

If one team member is absent:

A substitute player is allowed.

Rules:

```
substitute not already in box
substitute approved before match
```

Substitute plays **only that match**.

Team identity remains unchanged.

---

# 10. Example System Flow

### Step 1 — Create Box

```
status = OPEN
players = []
```

---

### Step 2 — Players Join

```
players = 10
```

---

### Step 3 — Box Locks

```
status = LOCKED
teams generated
matches generated
```

---

### Step 4 — Matches Played

```
recordMatch()
```

---

### Step 5 — Rankings Computed

```
rankTeams()
```

---

### Step 6 — ELO Updated

```
applyEloChanges()
```

---

# 11. Future Improvements

Possible future extensions:

- True ELO model based on **expected win probability**
- Dynamic box placement based on player ELO
- Automatic match scheduling
- Live match scoring
- Seasonal rankings
- Club leagues
- Player statistics dashboard
- AI matchmaking for balanced boxes

---

# Summary

The Box Tournament System provides a structured way to organize competitive padel matches using:

- fixed teams
- round robin tournaments
- ranking and ELO progression
- club-based competition

It is designed to be easily implemented inside a **mobile application backend or game logic service**.
