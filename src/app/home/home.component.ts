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
  ];

  openDemo(demo: Demo): void {
    window.location.href = demo.assetPath;
  }
}
