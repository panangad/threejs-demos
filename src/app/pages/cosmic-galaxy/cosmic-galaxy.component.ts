import {
  Component, OnInit, OnDestroy, ElementRef, HostListener
} from '@angular/core';

export interface GalaxyLevel {
  name: string;
  subtitle: string;
  distance: string;
  galaxyCount: string;
  description: string;
  color: string;
  accent: string;
  glow: string;
  type: 'irregular' | 'regular' | 'spherical' | 'elliptical' | 'merging';
  discovered: string;
  funFact: string;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  delay: number;
}

export interface GalaxyParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  delay: number;
}

@Component({
  selector: 'app-cosmic-galaxy',
  templateUrl: './cosmic-galaxy.component.html',
  styleUrls: ['./cosmic-galaxy.component.scss']
})
export class CosmicGalaxyComponent implements OnInit, OnDestroy {

  levels: GalaxyLevel[] = [
    {
      name: 'Virgo Cluster',
      subtitle: 'Local Group Gateway',
      distance: '53.8 Mly',
      galaxyCount: '1,300+',
      description: 'The gravitational heart of our local supercluster. Home to M87 and its legendary 6,500-light-year relativistic jet — the first black hole ever imaged.',
      color: '#6d28d9',
      accent: '#c084fc',
      glow: 'rgba(192,132,252,0.25)',
      type: 'irregular',
      discovered: '1779',
      funFact: 'The M87 black hole weighs 6.5 billion suns'
    },
    {
      name: 'Perseus Cluster',
      subtitle: 'Radio Halo Anomaly',
      distance: '240 Mly',
      galaxyCount: '1,000+',
      description: 'Emitting the deepest sound ever detected in the universe — a B♭ note, 57 octaves below middle C, rippling through 100-million-degree X-ray gas.',
      color: '#1e3a8a',
      accent: '#60a5fa',
      glow: 'rgba(96,165,250,0.25)',
      type: 'regular',
      discovered: '1901',
      funFact: 'Sound waves here span 30,000 light-years'
    },
    {
      name: 'Coma Cluster',
      subtitle: 'Dark Matter Citadel',
      distance: '321 Mly',
      galaxyCount: '1,000+',
      description: 'The cluster that revealed dark matter in 1933. Fritz Zwicky found galaxies moving far too fast for visible mass alone — 90% of this cluster is invisible.',
      color: '#0f4c3a',
      accent: '#2dd4bf',
      glow: 'rgba(45,212,191,0.25)',
      type: 'spherical',
      discovered: '1785',
      funFact: '90% of this cluster\'s mass is dark matter'
    },
    {
      name: 'Abell 2029',
      subtitle: 'Titan of the Deep',
      distance: '1.07 Bly',
      galaxyCount: '500+',
      description: 'Centered on IC 1101, the largest known galaxy — a supergiant elliptical stretching 6 million light-years across, engulfing everything in its path.',
      color: '#78350f',
      accent: '#fbbf24',
      glow: 'rgba(251,191,36,0.25)',
      type: 'elliptical',
      discovered: '1958',
      funFact: 'IC 1101 could swallow the Milky Way 60× over'
    },
    {
      name: 'El Gordo',
      subtitle: 'The Cosmic Colossus',
      distance: '9.7 Bly',
      galaxyCount: '200+',
      description: 'Two massive clusters colliding at 11 million km/h, carrying 2,000 trillion solar masses. Seen as it was when the universe was just 4 billion years old.',
      color: '#7f1d1d',
      accent: '#fb7185',
      glow: 'rgba(251,113,133,0.25)',
      type: 'merging',
      discovered: '2012',
      funFact: 'Largest known structure in the early universe'
    }
  ];

  currentLevel = 0;
  isTraveling = false;
  travelDirection: 'forward' | 'backward' = 'forward';
  isFullscreen = false;
  showIntro = true;

  stars: Star[] = [];
  galaxyParticles: GalaxyParticle[] = [];

  private travelTimers: any[] = [];

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.generateStars();
    this.generateGalaxyParticles();
    // Hide intro overlay after brief moment
    setTimeout(() => { this.showIntro = false; }, 200);
  }

  ngOnDestroy() {
    this.travelTimers.forEach(t => clearTimeout(t));
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  get level(): GalaxyLevel {
    return this.levels[this.currentLevel];
  }

  get levelStyles(): { [key: string]: string } {
    const l = this.levels[this.currentLevel];
    return {
      '--level-color': l.color,
      '--level-accent': l.accent,
      '--level-glow': l.glow,
    };
  }

  generateStars() {
    this.stars = [];
    for (let i = 0; i < 220; i++) {
      this.stars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() < 0.65 ? 1 : Math.random() < 0.9 ? 2 : 3,
        opacity: 0.25 + Math.random() * 0.75,
        twinkleSpeed: 2 + Math.random() * 5,
        delay: Math.random() * 6
      });
    }
  }

  generateGalaxyParticles() {
    this.galaxyParticles = [];
    const level = this.levels[this.currentLevel];
    const count = 55;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Cluster density varies by type
      const spread = level.type === 'spherical' ? 0.38 :
                     level.type === 'elliptical' ? 0.32 :
                     level.type === 'merging' ? 0.42 : 0.36;
      const radius = (0.08 + Math.pow(Math.random(), 0.6) * spread) * 100;
      const yCompression = level.type === 'elliptical' ? 0.5 :
                           level.type === 'merging' ? 0.7 : 0.65;

      this.galaxyParticles.push({
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius * yCompression,
        size: 1 + Math.random() * (level.type === 'elliptical' ? 6 : 4),
        opacity: 0.35 + Math.random() * 0.65,
        color: Math.random() > 0.45 ? level.accent : '#ffffff',
        delay: Math.random() * 4
      });
    }
  }

  navigate(direction: number) {
    if (this.isTraveling) return;
    const newLevel = this.currentLevel + direction;
    if (newLevel < 0 || newLevel >= this.levels.length) return;

    this.travelDirection = direction > 0 ? 'forward' : 'backward';
    this.isTraveling = true;

    const t1 = setTimeout(() => {
      this.currentLevel = newLevel;
      this.generateGalaxyParticles();
    }, 1400);

    const t2 = setTimeout(() => {
      this.isTraveling = false;
    }, 2800);

    this.travelTimers.push(t1, t2);
  }

  jumpToLevel(index: number) {
    if (this.isTraveling || index === this.currentLevel) return;
    const direction = index > this.currentLevel ? 1 : -1;
    this.travelDirection = direction > 0 ? 'forward' : 'backward';
    this.isTraveling = true;

    const t1 = setTimeout(() => {
      this.currentLevel = index;
      this.generateGalaxyParticles();
    }, 1400);

    const t2 = setTimeout(() => {
      this.isTraveling = false;
    }, 2800);

    this.travelTimers.push(t1, t2);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      const wrapper = this.el.nativeElement.querySelector('.cosmic-galaxy-wrapper');
      wrapper?.requestFullscreen?.().then(() => {
        this.isFullscreen = true;
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        this.isFullscreen = false;
      }).catch(() => {});
    }
  }

  enterFullscreen() {
    const wrapper = this.el.nativeElement.querySelector('.cosmic-galaxy-wrapper');
    wrapper?.requestFullscreen?.().then(() => {
      this.isFullscreen = true;
    }).catch(() => {});
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange() {
    this.isFullscreen = !!document.fullscreenElement;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'd') {
      this.navigate(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'a') {
      this.navigate(-1);
    } else if (e.key === 'f' || e.key === 'F') {
      this.toggleFullscreen();
    }
  }
}
