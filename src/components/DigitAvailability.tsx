interface DigitAvailabilityProps {
  digitUsage: Record<number, number>;
  maxUses: number;
}

function getUsageLevel(remaining: number, maxUses: number): string {
  if (remaining <= 0) return 'exhausted';
  const ratio = remaining / maxUses;
  if (ratio > 0.5) return 'high';      // > 50% remaining - green
  if (ratio > 0.25) return 'medium';   // 25-50% remaining - yellow
  return 'low';                         // < 25% remaining - red/orange
}

export function DigitAvailability({ digitUsage, maxUses }: DigitAvailabilityProps) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="digit-availability">
      <div className="digit-availability-list">
        {digits.map((digit) => {
          const used = digitUsage[digit] || 0;
          const remaining = maxUses - used;
          const level = getUsageLevel(remaining, maxUses);

          return (
            <div
              key={digit}
              className={`digit-availability-item ${level}`}
              title={`${digit}: ${remaining}/${maxUses} remaining`}
            >
              <span className="digit-value">{digit}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
