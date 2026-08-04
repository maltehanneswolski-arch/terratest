import { useEffect, useMemo, useState } from 'react';

const ICON_URLS: Record<string, string> = {
  capsule: 'https://storage.readdy-site.link/project_files/6e77d3bb-06f5-4a28-8497-ef9a4894cf5e/266f697a-6973-4316-a3c8-89e3056af3f5_capsule.png?v=717f022c43bc8ca33fa97367c727074c',
  circle:  'https://storage.readdy-site.link/project_files/6e77d3bb-06f5-4a28-8497-ef9a4894cf5e/15c6771b-4db8-4d0e-8c0d-87bdbe82760b_circle.png?v=c17b41bb4c284b0444832a365a2d7fec',
  quarter: 'https://storage.readdy-site.link/project_files/6e77d3bb-06f5-4a28-8497-ef9a4894cf5e/33261738-06ee-45b7-b7ad-f51f23e74cab_quarter.png?v=ab2d254187e3d0c98b727b750e5ba9bb',
  square:  'https://storage.readdy-site.link/project_files/6e77d3bb-06f5-4a28-8497-ef9a4894cf5e/55bb0e81-3518-492e-8650-420e8992a332_square.png?v=f7d8f9657532db2a7516634cf35edfd4',
  stack:   'https://storage.readdy-site.link/project_files/6e77d3bb-06f5-4a28-8497-ef9a4894cf5e/314dbe7d-8a5c-47b8-b3dc-114d787b285c_stack.png?v=36f3b14e715784f5ac0dbf4b7c5254e9',
  triangle:'https://storage.readdy-site.link/project_files/6e77d3bb-06f5-4a28-8497-ef9a4894cf5e/4e1b5b81-0f7a-4b6b-8b05-dd71c4125451_triangle.png?v=02e754250bf1babf85d63c4b2877be9a',
};

type IconType = keyof typeof ICON_URLS | 'sun';

type IconSpec = {
  type: IconType;
  top: string;
  left?: string;
  right?: string;
  width: number;
  opacity: number;
  rotate: number;
  speed: number;
  sway: number;
  spin: number;
};

const ICONS: IconSpec[] = [
  { type: 'circle',   top: '7%',  left: '4%',   width: 78,  opacity: 0.18, rotate: 0,   speed: 0.045, sway: 18, spin: 0.004  },
  { type: 'triangle', top: '13%', left: '18%',  width: 72,  opacity: 0.18, rotate: 0,   speed: 0.075, sway: 14, spin: -0.006 },
  { type: 'quarter',  top: '9%',  right: '8%',  width: 92,  opacity: 0.20, rotate: 90,  speed: 0.06,  sway: 22, spin: 0.01   },
  { type: 'square',   top: '23%', left: '9%',   width: 66,  opacity: 0.18, rotate: 0,   speed: 0.09,  sway: 12, spin: 0      },
  { type: 'stack',    top: '28%', right: '18%', width: 86,  opacity: 0.16, rotate: 0,   speed: 0.065, sway: 18, spin: -0.005 },
  { type: 'capsule',  top: '37%', left: '3%',   width: 108, opacity: 0.14, rotate: 0,   speed: 0.04,  sway: 10, spin: 0.004  },
  { type: 'sun',      top: '35%', right: '5%',  width: 140, opacity: 0.13, rotate: 0,   speed: 0.08,  sway: 16, spin: 0.012  },
  { type: 'circle',   top: '48%', right: '27%', width: 58,  opacity: 0.15, rotate: 0,   speed: 0.07,  sway: 20, spin: -0.01  },
  { type: 'triangle', top: '52%', left: '21%',  width: 88,  opacity: 0.17, rotate: 180, speed: 0.055, sway: 16, spin: 0.006  },
  { type: 'quarter',  top: '61%', right: '10%', width: 78,  opacity: 0.20, rotate: 270, speed: 0.085, sway: 24, spin: -0.008 },
  { type: 'square',   top: '68%', left: '8%',   width: 54,  opacity: 0.18, rotate: 0,   speed: 0.04,  sway: 12, spin: 0      },
  { type: 'capsule',  top: '74%', right: '22%', width: 116, opacity: 0.14, rotate: 0,   speed: 0.06,  sway: 10, spin: 0.004  },
  { type: 'stack',    top: '79%', left: '28%',  width: 82,  opacity: 0.17, rotate: 0,   speed: 0.075, sway: 15, spin: -0.008 },
  { type: 'sun',      top: '84%', left: '72%',  width: 112, opacity: 0.13, rotate: 0,   speed: 0.05,  sway: 14, spin: 0.009  },
];

function SunMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="#f0c533">
        <circle cx="50" cy="50" r="15" />
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x="47" y="6" width="6" height="32" transform={`rotate(${i * 30} 50 50)`} />
        ))}
      </g>
    </svg>
  );
}

export function BauhausBackground() {
  const [scrollY, setScrollY] = useState(0);
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1440,
  );

  useEffect(() => {
    let frame = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() =>
        setScrollY(window.scrollY || window.pageYOffset || 0),
      );
    };
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleScroll();
    handleResize();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const icons = useMemo(() => {
    const compact = viewportWidth < 900;
    return ICONS.filter((_, i) => !compact || i % 2 === 0);
  }, [viewportWidth]);

  const renderGraphic = (type: IconType) => {
    if (type === 'sun') return <SunMark className="w-full h-full" />;
    return (
      <img
        src={ICON_URLS[type]}
        alt=""
        className="w-full h-full object-contain select-none"
        draggable={false}
      />
    );
  };

  return (
    <div className="bauhaus-background" aria-hidden="true">
      {icons.map((icon, index) => {
        const driftY = scrollY * icon.speed;
        const driftX = Math.sin(scrollY / 220 + index * 0.9) * icon.sway;
        const rotation = icon.rotate + scrollY * icon.spin;
        return (
          <div
            key={`${icon.type}-${index}`}
            className="bauhaus-bg-icon"
            style={{
              top: icon.top,
              left: icon.left,
              right: icon.right,
              width: `${icon.width}px`,
              opacity: icon.opacity,
              transform: `translate3d(${driftX}px, ${driftY}px, 0) rotate(${rotation}deg)`,
            }}
          >
            {renderGraphic(icon.type)}
          </div>
        );
      })}
    </div>
  );
}
