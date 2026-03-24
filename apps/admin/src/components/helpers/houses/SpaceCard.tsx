import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Card, Space, Tooltip, Typography } from "antd";

interface SpaceCardProps {
  name: string;
  category: string;
  onClick: () => void;
  onDelete: () => void;
  spaceId: string;
}

const SpaceCard: React.FC<SpaceCardProps> = ({
  category,
  name,
  onClick,
  onDelete,
  spaceId,
}) => {
  const handleDelete: React.MouseEventHandler<HTMLElement> = (e) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <Card
      onClick={onClick}
      hoverable
      className="cursor-pointer bg-zui-light hover:bg-zui-light/80 border border-zui-light/20"
    >
      <div className="flex items-center justify-between">
        <Space direction="horizontal" size={8}>
          <Typography.Text strong>{name}</Typography.Text>
          <Typography.Text type="secondary">{category}</Typography.Text>
        </Space>

        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={onClick}
              size="small"
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              size="small"
              danger
            />
          </Tooltip>
        </Space>
      </div>
    </Card>
  );
};

export default SpaceCard;
