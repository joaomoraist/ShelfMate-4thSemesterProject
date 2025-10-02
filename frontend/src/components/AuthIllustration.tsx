import { useEffect, useState } from "react";

interface AuthIllustrationProps {
  images: string[];
  intervalMs?: number;
}

export default function AuthIllustration({ images, intervalMs = 3500 }: AuthIllustrationProps) {
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    if (!images || images.length === 0) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images, intervalMs]);

  const current = images && images.length > 0 ? images[index] : undefined;

  return (
    <div className="auth-illustration">
      <div className="auth-phone">
        {current ? <img src={current} alt="Phone" /> : null}
        <div className="auth-dots">
          {images.map((_, i) => (
            <span key={i} className={i === index ? 'active' : ''}></span>
          ))}
        </div>
      </div>
    </div>
  );
}


