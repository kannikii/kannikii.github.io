import { useEffect, useId, useRef } from 'react';
import { gsap } from 'gsap';

import './DecayCard.css';

const DecayCard = ({
  width = 300,
  height = 400,
  image = 'https://picsum.photos/300/400?grayscale',
  children,
}) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const displacementMapRef = useRef(null);
  const frameRef = useRef(0);
  const filterId = useId().replace(/:/g, '');
  const boundsRef = useRef({ width: 1, height: 1 });
  const cursor = useRef({ x: 0, y: 0 });
  const cachedCursor = useRef({ ...cursor.current });
  const isActive = useRef(false);

  useEffect(() => {
    const lerp = (a, b, n) => (1 - n) * a + n * b;

    const map = (x, a, b, c, d) => ((x - a) * (d - c)) / (b - a) + c;

    const distance = (x1, x2, y1, y2) => {
      const a = x1 - x2;
      const b = y1 - y2;
      return Math.hypot(a, b);
    };

    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const updateBounds = () => {
      const rect = container.getBoundingClientRect();
      boundsRef.current = {
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1),
      };
    };

    updateBounds();
    cursor.current = {
      x: boundsRef.current.width / 2,
      y: boundsRef.current.height / 2,
    };
    cachedCursor.current = { ...cursor.current };

    const updatePointer = (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      boundsRef.current = {
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1),
      };

      cursor.current = {
        x: Math.max(0, Math.min(boundsRef.current.width, clientX - rect.left)),
        y: Math.max(0, Math.min(boundsRef.current.height, clientY - rect.top)),
      };
    };

    const handleMouseMove = (event) => {
      isActive.current = true;
      updatePointer(event.clientX, event.clientY);
    };

    const handleMouseLeave = () => {
      isActive.current = false;
    };

    const handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        isActive.current = true;
        updatePointer(event.touches[0].clientX, event.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      isActive.current = false;
    };

    window.addEventListener('resize', updateBounds);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    const imgValues = {
      imgTransforms: { x: 0, y: 0, rz: 0 },
      displacementScale: 0,
    };

    const render = () => {
      const targetCursor = isActive.current
        ? cursor.current
        : {
            x: boundsRef.current.width / 2,
            y: boundsRef.current.height / 2,
          };

      let targetX = lerp(
        imgValues.imgTransforms.x,
        map(targetCursor.x, 0, boundsRef.current.width, -120, 120),
        0.1
      );
      let targetY = lerp(
        imgValues.imgTransforms.y,
        map(targetCursor.y, 0, boundsRef.current.height, -120, 120),
        0.1
      );
      const targetRz = lerp(
        imgValues.imgTransforms.rz,
        map(targetCursor.x, 0, boundsRef.current.width, -10, 10),
        0.1
      );

      const bound = 50;

      if (targetX > bound) targetX = bound + (targetX - bound) * 0.2;
      if (targetX < -bound) targetX = -bound + (targetX + bound) * 0.2;
      if (targetY > bound) targetY = bound + (targetY - bound) * 0.2;
      if (targetY < -bound) targetY = -bound + (targetY + bound) * 0.2;

      imgValues.imgTransforms.x = targetX;
      imgValues.imgTransforms.y = targetY;
      imgValues.imgTransforms.rz = targetRz;

      if (svgRef.current) {
        gsap.set(svgRef.current, {
          x: imgValues.imgTransforms.x,
          y: imgValues.imgTransforms.y,
          rotateZ: imgValues.imgTransforms.rz,
        });
      }

      const cursorTravelledDistance = distance(
        cachedCursor.current.x,
        targetCursor.x,
        cachedCursor.current.y,
        targetCursor.y
      );

      imgValues.displacementScale = lerp(
        imgValues.displacementScale,
        map(cursorTravelledDistance, 0, 200, 0, 400),
        0.06
      );

      if (displacementMapRef.current) {
        gsap.set(displacementMapRef.current, {
          attr: { scale: imgValues.displacementScale },
        });
      }

      cachedCursor.current = { ...targetCursor };
      frameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', updateBounds);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div className="decay-card" style={style} ref={containerRef}>
      <div className="decay-card-visual" ref={svgRef}>
        <svg viewBox="-60 -75 720 900" preserveAspectRatio="xMidYMid slice" className="decay-card-svg">
          <filter id={filterId}>
            <feTurbulence
              type="turbulence"
              baseFrequency="0.015"
              numOctaves="5"
              seed="4"
              stitchTiles="stitch"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              result="turbulence1"
            />
            <feDisplacementMap
              ref={displacementMapRef}
              in="SourceGraphic"
              in2="turbulence1"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="B"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              result="displacementMap3"
            />
          </filter>
          <g>
            <image
              href={image}
              x="0"
              y="0"
              width="600"
              height="750"
              filter={`url(#${filterId})`}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        </svg>
        <div className="decay-card-text">{children}</div>
      </div>
    </div>
  );
};

export default DecayCard;
