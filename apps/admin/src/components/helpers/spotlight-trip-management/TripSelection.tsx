import { Alert, Card, Typography } from "antd";
import React from "react";
import { Form } from "../../Form";

const { Title, Text } = Typography;

interface TripSelectionProps {
  form: any;
  tripOptions: Array<{ value: string; label: string }>;
  isLoadingTrips: boolean;
  onTripSelection: (selectedTripIds: string[]) => void;
  maxSpotlightTrips: number;
  hasExistingTracks?: boolean;
  filledPositionsCount?: number;
}

const TripSelection: React.FC<TripSelectionProps> = ({
  form,
  tripOptions,
  isLoadingTrips,
  onTripSelection,
  maxSpotlightTrips,
  hasExistingTracks = false,
  filledPositionsCount = 0,
}) => {
  const availableSlots = maxSpotlightTrips - filledPositionsCount;
  const isAddingToExisting = hasExistingTracks && filledPositionsCount > 0;

  return (
    <Card className="bg-zui-dark border-zui-silver/20">
      <div className="mb-4">
        <Title level={4} className="text-zui-neon mb-2 flex items-center">
          <span className="mr-2">🎯</span>
          {isAddingToExisting
            ? "Add More Spotlight Trips"
            : "Select Spotlight Trips"}
        </Title>
        <Text className="text-zui-silver">
          {isAddingToExisting
            ? `You have ${availableSlots} empty ${
                availableSlots === 1 ? "position" : "positions"
              } available to fill`
            : `Choose up to ${maxSpotlightTrips} trips to feature in your spotlight`}
        </Text>
      </div>

      <Form
        formData={form}
        formFields={[
          {
            name: "initial_trips",
            type: "multiSelect",
            label: isAddingToExisting
              ? "Available Trips to Add"
              : "Available Trips",
            placeholder: isAddingToExisting
              ? "Select trips to fill empty positions"
              : "Select trips for spotlight positions",
            required: false,
            options: tripOptions,
          },
        ]}
        onValueChange={(changedValues: any) => {
          if (changedValues.initial_trips) {
            onTripSelection(changedValues.initial_trips);
          }
        }}
      />

      {tripOptions.length === 0 && !isLoadingTrips && (
        <Alert
          message="No trips available"
          description="Please create some trips first to add them to spotlight"
          type="warning"
          showIcon
          className="mt-3 bg-yellow-500/10 border-yellow-500/20"
        />
      )}

      {isAddingToExisting && (
        <div className="mt-3 p-2 bg-zui-neon/10 border border-zui-neon/20 rounded-lg">
          <Text className="text-zui-neon text-xs">
            💡 Tip: Selected trips will be added to your existing spotlight
            positions
          </Text>
        </div>
      )}
    </Card>
  );
};

export default TripSelection;
