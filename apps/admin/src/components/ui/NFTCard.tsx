import { Card, Typography } from "antd";
import React, { useState, useEffect, useRef } from "react";

interface NftCardProps {
  link?: string;
  collection: string;
  tokenId?: string;
  image?: string;
  animation?: string;
}

const NftCard: React.FC<NftCardProps> = ({
  link,
  image = "",
  collection,
  tokenId,
  animation,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <Card
      ref={cardRef}
      hoverable
      onClick={link ? () => window.open(link, "_blank") : undefined}
      styles={{ body: { padding: 16 } }}
      className="aspect-square w-full border-zui-light hover:border-zui-neon"
      cover={
        <div className="bg-transparent overflow-hidden w-full aspect-square">
          {isVisible && (
            <>
              {animation ? (
                <video
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover p-[1px]"
                >
                  <source src={animation} type="video/mp4" />
                </video>
              ) : image ? (
                <img
                  loading="lazy"
                  src={image}
                  alt={`${collection} #${tokenId}`}
                  className="w-full h-full object-cover p-[1px]"
                />
              ) : (
                <Typography.Text className="text-[#8c8c8c]">
                  No Image Found
                </Typography.Text>
              )}
            </>
          )}
        </div>
      }
    >
      <Card.Meta
        className="p-0"
        title={collection}
        description={`#${tokenId}`}
      />
    </Card>
  );
};

export default NftCard;
