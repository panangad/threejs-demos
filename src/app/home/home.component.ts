import { Component } from '@angular/core';

interface Demo {
  id: string;
  title: string;
  tagline: string;
  description: string;
  assetPath: string;
  tags: string[];
  color: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  readonly demos: Demo[] = [
    {
      id: 'galaxy-odyssey',
      title: 'Galaxy Cluster Odyssey',
      tagline: 'Fly through the cosmos as your journey unfolds',
      description:
        'A real-time 3-D space flight past 5 uniquely themed galaxies — one per level. ' +
        'Watch Orion Nursery, Aurora Stream, Emerald Veil, Crimson Tide and Stellar Crown drift by ' +
        'as you climb from Scout to Legend over 5 days of the cluster.',
      assetPath: 'assets/galaxy-odyssey/index.html',
      tags: ['Three.js', 'Space', 'Timeline'],
      color: '#8deefc',
    },
    {
      id: 'mountain-climb',
      title: 'Survivor: Mountain Climb',
      tagline: 'Scale the peaks of Mount Eternity to survive',
      description:
        'A 2-D survivor race up 5 high-altitude camps. Watch your climbers tackle Blizzard Pass ' +
        'and the Death Zone. The bottom 30% are eliminated at each camp, falling off the cliffs ' +
        'until only the ultimate survivors stand atop the Summit.',
      assetPath: 'assets/mountain-climb/index.html',
      tags: ['CSS/HTML', 'Survivor', 'Timeline', '2D'],
      color: '#ffd69f',
    },
  ];

  openDemo(demo: Demo): void {
    window.location.href = demo.assetPath;
  }
}
