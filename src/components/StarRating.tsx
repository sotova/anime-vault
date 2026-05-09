'use client';

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ value, onChange, size = 20, readonly = false }: StarRatingProps) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !readonly && onChange?.(value === star ? 0 : star)}
          style={{
            cursor: readonly ? 'default' : 'pointer',
            fontSize: `${size}px`,
            color: star <= value ? '#d4a843' : '#444',
            transition: 'color 0.15s, transform 0.15s',
            display: 'inline-block',
          }}
          onMouseEnter={(e) => { if (!readonly) e.currentTarget.style.transform = 'scale(1.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
