const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerRing({ secondsLeft, totalSeconds }) {
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;

  return (
    <div className="ring">
      <svg viewBox="0 0 250 250">
        <circle className="ring-bg" cx="125" cy="125" r={RADIUS} />
        <circle
          className="ring-progress"
          cx="125"
          cy="125"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <div className="ring-time">
        {minutes}:{seconds}
      </div>
    </div>
  );
}