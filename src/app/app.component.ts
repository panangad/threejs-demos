import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';

interface PlayerSnapshot {
  name: string;
  points: number;
  color: string;
  accent: string;
}

interface DaySnapshot {
  date: string;
  label: string;
  players: PlayerSnapshot[];
}

interface LevelDefinition {
  name: string;
  map: string;
  threshold: number;
}

interface PlayerNode extends PlayerSnapshot {
  level: string;
  currentMap: string;
  orbit: number;
  size: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Galaxy Cluster Odyssey';
  readonly timelineDays: DaySnapshot[];
  readonly levelConfig: LevelDefinition[] = [
    { name: 'Scout', map: 'Orion Gate', threshold: 0 },
    { name: 'Navigator', map: 'Aurora Drift', threshold: 1400 },
    { name: 'Captain', map: 'Nebula Run', threshold: 2800 },
    { name: 'Legend', map: 'Cosmic Reef', threshold: 4200 }
  ];

  currentPlayers: PlayerNode[] = [];
  timelinePercent = 0;
  currentDayLabel = '';
  currentRecap = '';
  private animationFrame = 0;
  private playbackMs = 0;
  private readonly totalDurationMs = 22000;
  private readonly startDate = new Date('2026-05-01');

  constructor(private readonly ngZone: NgZone, private readonly cdr: ChangeDetectorRef) {
    this.timelineDays = this.buildTimeline();
  }

  ngOnInit(): void {
    this.startPlayback();
  }

  ngOnDestroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  restartTimeline(): void {
    this.playbackMs = 0;
  }

  getPlayerStyle(player: PlayerNode): Record<string, string> {
    const orbitAngle = this.playbackMs / 3000 + player.orbit * 1.35;
    const radius = 24 + player.orbit * 16 + player.size * 8;
    const x = Math.cos(orbitAngle) * radius;
    const y = Math.sin(orbitAngle * 0.65) * (radius * 0.58) - (this.playbackMs / 3000) * 6;
    const scale = 0.7 + (player.points / 9000) * 0.25;

    return {
      left: `calc(50% + ${x.toFixed(2)}%)`,
      top: `calc(50% + ${y.toFixed(2)}%)`,
      transform: `translate(-50%, -50%) scale(${scale.toFixed(2)})`,
      '--orb-color': player.color,
      '--orb-glow': player.accent,
      '--orb-size': `${(0.8 + player.size * 0.15).toFixed(2)}rem`
    };
  }

  private startPlayback(): void {
    this.ngZone.runOutsideAngular(() => {
      const tick = (timestamp: number) => {
        if (!this.playbackMs) {
          this.playbackMs = timestamp;
        }
        const elapsed = timestamp - this.playbackMs;
        const progress = (elapsed % this.totalDurationMs) / this.totalDurationMs;
        const position = progress * (this.timelineDays.length - 1);
        const dayIndex = Math.min(this.timelineDays.length - 1, Math.floor(position));
        const nextIndex = Math.min(this.timelineDays.length - 1, dayIndex + 1);
        const blend = position - dayIndex;
        const currentDay = this.timelineDays[dayIndex];
        const nextDay = this.timelineDays[nextIndex];

        this.timelinePercent = progress * 100;
        this.currentDayLabel = `${this.formatDayLabel(currentDay.date)} • ${currentDay.label}`;
        this.currentPlayers = this.buildPlayerNodes(currentDay, nextDay, blend);
        this.currentRecap = `${this.currentPlayers[0].name} is crossing ${this.currentPlayers[0].currentMap} with ${this.currentPlayers[0].points.toLocaleString()} pts.`;

        this.ngZone.run(() => this.cdr.detectChanges());
        this.animationFrame = requestAnimationFrame(tick);
      };

      this.animationFrame = requestAnimationFrame(tick);
    });
  }

  private buildPlayerNodes(currentDay: DaySnapshot, nextDay: DaySnapshot, blend: number): PlayerNode[] {
    return currentDay.players.map((player, index) => {
      const nextPlayer = nextDay.players[index] ?? player;
      const points = Math.round(player.points + (nextPlayer.points - player.points) * blend);
      const level = this.resolveLevel(points);
      return {
        ...player,
        points,
        level: level.name,
        currentMap: level.map,
        orbit: 0.4 + index * 0.2,
        size: 0.8 + Math.max(0.05, points / 12000)
      };
    }).sort((left, right) => right.points - left.points);
  }

  private resolveLevel(points: number): LevelDefinition {
    let activeLevel = this.levelConfig[0];
    for (const level of this.levelConfig) {
      if (points >= level.threshold) {
        activeLevel = level;
      }
    }
    return activeLevel;
  }

  private buildTimeline(): DaySnapshot[] {
    const seeds: DaySnapshot[] = [
      {
        date: '2026-05-01',
        label: 'Launch',
        players: [
          { name: 'You', points: 1200, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 980, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 860, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 760, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 700, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-05-05',
        label: 'First orbit',
        players: [
          { name: 'You', points: 1380, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 1120, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 960, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 880, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 820, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-05-09',
        label: 'Nebula drift',
        players: [
          { name: 'You', points: 1640, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 1280, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 1100, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 1010, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 940, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-05-13',
        label: 'Rising winds',
        players: [
          { name: 'You', points: 1820, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 1410, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 1260, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 1170, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 1080, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-05-19',
        label: 'Stellar gate',
        players: [
          { name: 'You', points: 2100, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 1580, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 1430, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 1310, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 1210, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-05-25',
        label: 'Silver comet',
        players: [
          { name: 'You', points: 2460, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 1720, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 1590, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 1450, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 1360, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-06-02',
        label: 'Emerald wake',
        players: [
          { name: 'You', points: 2820, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 1940, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 1780, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 1630, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 1510, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-06-10',
        label: 'Aural burst',
        players: [
          { name: 'You', points: 3180, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 2140, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 1980, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 1790, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 1680, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-06-17',
        label: 'Cosmos edge',
        players: [
          { name: 'You', points: 3570, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 2360, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 2220, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 2080, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 1950, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-06-24',
        label: 'Pulse line',
        players: [
          { name: 'You', points: 3920, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 2510, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 2390, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 2250, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 2110, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-07-01',
        label: 'Arc of light',
        players: [
          { name: 'You', points: 4300, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 2680, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 2570, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 2410, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 2280, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-07-09',
        label: 'Nova bloom',
        players: [
          { name: 'You', points: 4690, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 2870, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 2760, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 2590, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 2470, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-07-18',
        label: 'Atlas rise',
        players: [
          { name: 'You', points: 5080, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 3080, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 2970, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 2810, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 2690, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      },
      {
        date: '2026-07-25',
        label: 'Current arc',
        players: [
          { name: 'You', points: 5460, color: '#8deefc', accent: '#74d8ff' },
          { name: 'Lyra', points: 3320, color: '#ff8bd0', accent: '#ff5fcc' },
          { name: 'Rook', points: 3200, color: '#8dffb3', accent: '#3ef5a5' },
          { name: 'Nia', points: 3040, color: '#ffd69f', accent: '#ffb347' },
          { name: 'Tavi', points: 2900, color: '#c6a8ff', accent: '#8e6bff' }
        ]
      }
    ];

    const timeline: DaySnapshot[] = [];
    const endDate = new Date();
    const endDateValue = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    for (let offset = 0; offset <= 60; offset += 1) {
      const day = new Date(this.startDate);
      day.setDate(this.startDate.getDate() + offset);
      const dayValue = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
      if (dayValue > endDateValue) {
        break;
      }
      const seed = seeds.reduce((latest, candidate) => {
        const candidateValue = Date.parse(candidate.date);
        return dayValue >= candidateValue ? candidate : latest;
      }, seeds[0]);
      timeline.push({
        date: day.toISOString().slice(0, 10),
        label: seed.label,
        players: seed.players.map((player) => ({ ...player }))
      });
    }

    return timeline.length > 0 ? timeline : seeds.map((seed) => ({ ...seed }));
  }

  private formatDayLabel(date: string): string {
    const parsed = new Date(`${date}T00:00:00`);
    return parsed.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
