import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useVisibilityState } from "@zo/utils/hooks";
import { Button, Card, Space, Tooltip, Typography, message } from "antd";
import { TripGuest } from "apps/admin/src/config";
import { useCallback, useMemo, useState } from "react";
import { AddTripGuestSidebar } from "../../sidebars";

const { Text } = Typography;

interface TripGuestsProps {
  guests: TripGuest[];
  totalUnits: number;
  setGuests: (guests: TripGuest[]) => void;
}

const TripGuests: React.FC<TripGuestsProps> = ({
  guests,
  totalUnits,
  setGuests,
}) => {
  const [isAddGuestVisible, showAddGuest, hideAddGuest] = useVisibilityState();
  const [editingGuest, setEditingGuest] = useState<TripGuest | undefined>();

  const mainGuest = guests[0];
  const additionalGuests = useMemo(() => guests.slice(1), [guests]);

  /** ---------- Handlers ---------- */

  const handleAddGuest = useCallback(() => {
    setEditingGuest(undefined);
    showAddGuest();
  }, [showAddGuest]);

  const handleEditGuest = useCallback(
    (guest: TripGuest) => {
      setEditingGuest(guest);
      showAddGuest();
    },
    [showAddGuest]
  );

  const handleDeleteGuest = useCallback(
    (guestId: string) => {
      setGuests(guests.filter((g) => g.id !== guestId));
    },
    [guests, setGuests]
  );

  const handleSaveGuest = useCallback(
    (guest: TripGuest) => {
      if (editingGuest) {
        setGuests(
          guests.map((g) =>
            g.id === editingGuest.id ? { ...guest, id: g.id } : g
          )
        );
      } else {
        setGuests([...guests, { ...guest, id: Date.now().toString() }]);
      }
    },
    [editingGuest, guests, setGuests]
  );

  /** ---------- Render helpers ---------- */
  const renderGuestCard = (guest: TripGuest, isMain = false) => (
    <Tooltip
      key={guest.id}
      title={
        isMain
          ? "Main guest contact information"
          : "Additional guest information"
      }
    >
      <Card size="small">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>
              {guest.first_name} {guest.last_name}
            </Text>
            <div className="text-sm text-zui-silver">
              {guest.email} • {guest.mobile}
            </div>
          </div>
          <Space>
            <Tooltip title="Edit guest details">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditGuest(guest)}
              />
            </Tooltip>
            <Tooltip title="Remove guest">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteGuest(guest.id!)}
              />
            </Tooltip>
          </Space>
        </div>
      </Card>
    </Tooltip>
  );

  /** ---------- UI ---------- */
  return (
    <>
      {/* Main Guest */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <Text className="text-base font-semibold">Main Guest</Text>
          {!mainGuest && (
            <Tooltip title="Add main guest information">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddGuest}
              >
                Add Guest
              </Button>
            </Tooltip>
          )}
        </div>
        {mainGuest ? (
          renderGuestCard(mainGuest, true)
        ) : (
          <div className="text-zui-silver text-sm">No main guest added</div>
        )}
      </div>

      {/* Additional Guests */}
      {totalUnits > 1 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-base font-semibold">Additional Guests</Text>
            {guests.length < totalUnits && (
              <Tooltip title="Add another guest to the booking">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddGuest}
                >
                  Add Guest
                </Button>
              </Tooltip>
            )}
          </div>
          <div className="space-y-2">
            {additionalGuests.length > 0 ? (
              additionalGuests.map((guest) => renderGuestCard(guest))
            ) : (
              <div className="text-zui-silver text-sm">No guests added</div>
            )}
          </div>
        </div>
      )}

      <AddTripGuestSidebar
        isOpen={isAddGuestVisible}
        onClose={hideAddGuest}
        guest={editingGuest}
        onSave={handleSaveGuest}
      />
    </>
  );
};

export default TripGuests;
