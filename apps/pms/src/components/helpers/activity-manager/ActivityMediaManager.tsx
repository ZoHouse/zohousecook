/* eslint-disable @next/next/no-img-element */
import { Button, Divider, Tag, Upload } from "antd";
import { Dispatch, SetStateAction, useState } from "react";

export type ActivityMedia = {
  id: string;
  url: string;
  file?: File;
  name?: string;
  status?: "active" | "inactive";
  category?: string;
  sort_index?: number; // 0-based position; 0 = first (cover)
  formData?: FormData;
  media_relation_id?: string;
};

interface ActivitiesMediaManagerProps {
  value: ActivityMedia[];
  status?: "active" | "inactive";
  onChange: Dispatch<SetStateAction<ActivityMedia[]>>;
}

const ActivitiesMediaManager: React.FC<ActivitiesMediaManagerProps> = ({
  value,
  status = "active",
  onChange,
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function buildFormData(item: ActivityMedia): FormData {
    const fd = new FormData();
    if (item.file) fd.append("file", item.file);
    if (item.name) fd.append("name", item.name);
    if (item.status) fd.append("status", item.status);
    if (item.category) fd.append("category", item.category);
    if (typeof item.sort_index === "number")
      fd.append("sort_index", String(item.sort_index));
    return fd;
  }

  function withPriorities(list: ActivityMedia[]): ActivityMedia[] {
    const total = list.length;
    return list.map((item, idx) => {
      // Ensure unique, position-based sort_index: greater value for earlier items
      const desired = total - idx;
      const next: ActivityMedia = { ...item, sort_index: desired };
      next.formData = buildFormData(next);
      return next;
    });
  }

  function handleBeforeUpload(file: File) {
    const url = URL.createObjectURL(file);
    onChange((prev) =>
      withPriorities([
        ...prev,
        {
          id: `${Date.now()}-${file.name}`,
          url,
          file,
          name: file.name,
          status,
          category: "image",
        },
      ])
    );
    return false; // prevent auto upload
  }

  function handleRemove(idx: number) {
    onChange((prev) => withPriorities(prev.filter((_, i) => i !== idx)));
  }

  function onDragStart(e: React.DragEvent<HTMLDivElement>, idx: number) {
    setDragIndex(idx);
    setOverIndex(idx);
    e.dataTransfer.effectAllowed = "move";
    const imgEl = (e.currentTarget.querySelector("img") ||
      null) as HTMLImageElement | null;
    if (imgEl) {
      try {
        e.dataTransfer.setDragImage(imgEl, imgEl.width / 2, imgEl.height / 2);
      } catch (err) {
        // ignore setDragImage unsupported environments
      }
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDragEnter(idx: number) {
    if (dragIndex !== null && idx !== overIndex) setOverIndex(idx);
  }

  function onDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  function onDrop(idx: number) {
    if (dragIndex === null || dragIndex === idx) return;
    onChange((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(dragIndex, 1);
      next.splice(idx, 0, moved);
      return withPriorities(next);
    });
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div>
      <Upload.Dragger
        multiple
        accept="image/*"
        beforeUpload={handleBeforeUpload}
        showUploadList={false}
        style={{ marginBottom: 12 }}
      >
        <p className="ant-upload-drag-icon">📷</p>
        <p className="ant-upload-text">Click or drag images to upload</p>
        <p className="ant-upload-hint">
          Drag cards below to reorder. First is cover.
        </p>
      </Upload.Dragger>
      {value.length > 0 && <Divider style={{ margin: "12px 0" }} />}
      <div className="media-grid">
        {value.map((m, idx) => {
          const cls = [
            "media-card",
            dragIndex === idx ? "dragging" : "",
            overIndex === idx && dragIndex !== null && dragIndex !== idx
              ? "drop-target"
              : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div
              key={m.id}
              className={cls}
              draggable
              onDragStart={(e) => onDragStart(e, idx)}
              onDragEnter={() => onDragEnter(idx)}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDrop={() => onDrop(idx)}
            >
              <img
                src={m.url}
                className="w-full h-full object-cover "
                alt={m.name || `image-${idx}`}
              />
              {idx === 0 ? (
                <Tag color="gold" className="cover-tag">
                  Cover
                </Tag>
              ) : null}
              <div className="media-actions">
                <Button size="small" danger onClick={() => handleRemove(idx)}>
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .media-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .media-card {
          position: relative;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          overflow: hidden;
          background: #111;
          cursor: grab;
        }
        .media-card img {
          width: 100%;
          height: 140px;
          object-fit: cover;
          display: block;
        }
        .media-card.dragging {
          opacity: 0.7;
          cursor: grabbing;
          outline: 2px dashed #666;
        }
        .media-card.drop-target::after {
          content: "";
          position: absolute;
          inset: 0;
          border: 2px dashed #888;
          pointer-events: none;
        }
        .media-actions {
          position: absolute;
          top: 6px;
          right: 6px;
        }
        :global(.cover-tag) {
          position: absolute;
          left: 6px;
          top: 6px;
        }
        @media (max-width: 768px) {
          .media-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default ActivitiesMediaManager;
