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
        'A real-time 3-D space flight that replays your progress from start to today. ' +
        'Watch a spiral galaxy drift past as your points climb through Scout, Navigator, Captain and Legend zones.',
      assetPath: 'assets/galaxy-odyssey/index.html',
      tags: ['Three.js', 'Space', 'Timeline'],
      color: '#8deefc',
    },
  ];

  openDemo(demo: Demo): void {
    window.location.href = demo.assetPath;
  }
}
