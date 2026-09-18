/**
 * 首页夜空：星点 + 流星 + 星云辉光。
 *
 * 纯白太空了 —— 而夜空里每一点光都可能是一个还没回家的人，
 * 地平线那层红光就是天快亮的地方。
 */

const STAR_COUNT = 130;
const METEOR_COUNT = 3;

// 星点位置必须在服务端与客户端算出同一份，否则水合会不一致，
// 所以用固定种子的伪随机，而不是 Math.random。
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 亮星带一点色温差异，全白的星空看起来像噪点
const BRIGHT_TINTS = ["#ffffff", "#ffe9cd", "#d6e4ff"];

interface Star {
  left: number;
  top: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
  glow: boolean;
}

interface Meteor {
  left: number;
  top: number;
  length: number;
  duration: number;
  delay: number;
}

function makeStars(): Star[] {
  const rand = mulberry32(20260918);
  return Array.from({ length: STAR_COUNT }, () => {
    const bright = rand() > 0.86;
    const tint = BRIGHT_TINTS[Math.floor(rand() * BRIGHT_TINTS.length)];
    return {
      left: rand() * 100,
      top: rand() * 100,
      size: bright ? 1.9 + rand() * 0.7 : 0.8 + rand() * 1.1,
      opacity: bright ? 0.75 + rand() * 0.25 : 0.28 + rand() * 0.45,
      duration: 2.4 + rand() * 4.6,
      delay: rand() * 7,
      color: bright ? tint : "#ffffff",
      glow: bright,
    };
  });
}

function makeMeteors(): Meteor[] {
  const rand = mulberry32(8868);
  return Array.from({ length: METEOR_COUNT }, () => ({
    // 从屏幕上方偏右往左下划过
    left: 42 + rand() * 52,
    top: 4 + rand() * 34,
    length: 110 + rand() * 90,
    duration: 7 + rand() * 6,
    delay: rand() * 14,
  }));
}

const STARS = makeStars();
const METEORS = makeMeteors();

export function Starfield() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* 星云：低饱和的冷暖对冲，让黑不是死黑 */}
      <div className="hero-nebula hero-nebula-blue" />
      <div className="hero-nebula hero-nebula-cyan" />
      <div className="hero-nebula hero-nebula-red" />

      {STARS.map((star, i) => (
        <span
          key={i}
          className={star.glow ? "hero-star hero-star-glow" : "hero-star"}
          style={
            {
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              color: star.color,
              opacity: star.opacity,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
              "--star-o": star.opacity,
            } as React.CSSProperties
          }
        />
      ))}

      {METEORS.map((meteor, i) => (
        <span
          key={`meteor-${i}`}
          className="hero-meteor"
          style={{
            left: `${meteor.left}%`,
            top: `${meteor.top}%`,
            width: `${meteor.length}px`,
            animationDuration: `${meteor.duration}s`,
            animationDelay: `${meteor.delay}s`,
          }}
        />
      ))}

      {/* 地平线：夜空在底部化进页面底色，也是天快亮的那道白 */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#f5fafc]" />
    </div>
  );
}
