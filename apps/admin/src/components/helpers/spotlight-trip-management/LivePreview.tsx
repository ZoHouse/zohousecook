import { StarOutlined } from "@ant-design/icons";
import { Card, Typography } from "antd";
import { SpotlightTrip } from "apps/admin/src/config";
import React from "react";

export interface LivePreviewProps {
  currentSpotlightTrips: SpotlightTrip[];
  maxSpotlightTrips: number;
}

const { Title, Text } = Typography;

const LivePreview: React.FC<LivePreviewProps> = ({
  currentSpotlightTrips,
  maxSpotlightTrips,
}) => {
  if (!currentSpotlightTrips || currentSpotlightTrips.length === 0) {
    return null;
  }

  return (
    <Card className="bg-zui-dark border-zui-silver/20">
      <Title level={4} className="text-zui-neon mb-4 flex items-center">
        <StarOutlined className="mr-2" />
        Current Live Preview
      </Title>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentSpotlightTrips
          .slice(0, maxSpotlightTrips)
          .map((spotlightTrip, index) => (
            <div
              key={spotlightTrip.pid}
              className="relative bg-zui-light border border-zui-silver/20 rounded-lg overflow-hidden hover:border-zui-neon/50 transition-colors"
            >
              <div className="aspect-video relative">
                <img
                  src={spotlightTrip.banner}
                  alt={spotlightTrip.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex items-center justify-center w-8 h-8 bg-zui-neon text-zui-dark rounded-full font-semibold text-xs">
                  #{index + 1}
                </div>
              </div>
              <div className="p-3">
                <Text strong className="text-zui-white text-sm block truncate">
                  {spotlightTrip.name}
                </Text>
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
};

export default LivePreview;
