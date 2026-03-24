import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Icon from "@zo/assets/icons";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import {
  Button,
  Card,
  Drawer,
  Form,
  Image,
  Input,
  Radio,
  Select,
  Spin,
  Upload,
} from "antd";
import { DefaultOptionType } from "antd/es/select";
import { UploadFile } from "antd/es/upload";
import { useEffect, useRef, useState } from "react";

interface AddPlaylistSidebarProps {
  isOpen: [string, string];
  onClose: (playlist: GeneralObject, sectionId: string) => void;
}

const SortableItem = ({
  id,
  name,
  type,
  isDraggable = true,
  onRemove,
}: {
  id: string;
  name: string;
  type: string;
  isDraggable?: boolean;
  onRemove: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      disabled: !isDraggable,
      transition: {
        duration: 150, // Shorter duration for smoother movement
        easing: "cubic-bezier(0.25, 1, 0.5, 1)", // Custom easing function for smoother acceleration/deceleration
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card size="small">
        <div className="flex justify-between items-start">
          <div className="flex flex-row items-center gap-2">
            {isDraggable && (
              <Button
                type="link"
                icon={<Icon name="Hamburger" size={24} />}
                {...attributes}
                {...listeners}
              />
            )}
            <div className="flex flex-col">
              <div>{name}</div>
              <div className="text-xs text-zui-silver">{type}</div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
            className="text-zui-gray hover:text-zui-red p-1 -mt-1 -mr-1"
          >
            ✕
          </button>
        </div>
      </Card>
    </div>
  );
};

const AddPlaylistSidebar: React.FC<AddPlaylistSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: structures } = useQueryApi<DefaultOptionType[]>("CAS_SEED", {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    select: (data) =>
      data.data.discover.home_page.structure.map((s: string) => ({
        value: s,
        label: formatCapitalize(s.replace(/-/g, " ")),
      })),
  });
  const [form] = Form.useForm();
  const [search, setSearch] = useState<string>("");
  const [isWatchingText, setWatchingText] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<DefaultOptionType[]>([]);
  const [coverImageFile, setCoverImageFile] = useState<UploadFile | null>(null);
  const [isImageError, setIsImageError] = useState(false);

  const {
    data: playlist,
    isLoading: isPlaylistLoading,
    isFetching: isPlaylistFetching,
    remove: removePlaylist,
  } = useQueryApi<GeneralObject>(
    "CAS_PLAYLISTS",
    {
      enabled: isValidString(isOpen[1]),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: false,
      select: (data) => data.data,
      onSuccess: (data) => {
        form.setFieldsValue({
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          structure: data.structure,
          status: data.status,
          order: data.data.order ? "order" : "random",
        });
      },
    },
    `${isOpen[1]}/`
  );

  const {
    isLoading: isTracksLoading,
    isFetching: isTracksFetching,
    data: tracks,
    remove: removeTracks,
  } = useQueryApi(
    "CAS_PLAYTRACKS",
    {
      enabled: isValidString(isOpen[1]),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: false,
      select: (data) => data.data,
      onSuccess: (data) => {
        const maxIndex = data.length * 1000; // Large number to ensure we have room for reordering
        setSelectedItems(
          data.map((t: any, index: number) => ({
            label: `${t.track_data.title} %% ${t.relation_type}`,
            value: t.relation_id,
            sort_index: maxIndex - index * 10, // Descending order with gaps for reordering
          }))
        );
      },
    },
    "",
    `playlist=${isOpen[1]}&limit=-1`
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const typingTimeout = useRef<any>(null);

  const {
    data: queryResults,
    isLoading,
    isFetching,
    remove: removeQueryResults,
  } = useQueryApi<DefaultOptionType[]>(
    "CAS_DISCOVER_SEARCH",
    {
      enabled: !isWatchingText && isValidString(search) && search.length > 0,
      select: (data) => {
        const options: DefaultOptionType[] = [];
        Object.keys(data.data).forEach((key) => {
          const values = data.data[key];
          values.forEach((value: any) => {
            if (!selectedItems.find((item) => item.value === value.id)) {
              options.push({
                label: `${value.name} %% ${key}`,
                value: value.id,
              });
            }
          });
        });
        return options;
      },
    },
    "",
    `query=${search.trim()}`
  );

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (isValidString(text)) {
      setWatchingText(true);
    }
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(async () => {
      setWatchingText(false);
    }, 1000);
  };

  const handleSelect = (value: string, option: DefaultOptionType) => {
    setSelectedItems((prev) => {
      const maxCurrentIndex =
        prev.length > 0
          ? Math.max(...prev.map((item) => item.sort_index || 0))
          : 1000;
      return [...prev, { ...option, sort_index: maxCurrentIndex + 10 }];
    });
    setSearch("");
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSelectedItems((items) => {
        const oldIndex = items.findIndex(
          (item) => String(item.value) === active.id
        );
        const newIndex = items.findIndex(
          (item) => String(item.value) === over.id
        );

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Recalculate sort_index values with gaps between them
        const maxIndex = newItems.length * 1000;
        return newItems.map((item, index) => ({
          ...item,
          sort_index: maxIndex - index * 10,
        }));
      });
    }
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((items) => {
      const filtered = items.filter((item) => String(item.value) !== id);
      const maxIndex = filtered.length * 1000;
      return filtered.map((item, index) => ({
        ...item,
        sort_index: maxIndex - index * 10,
      }));
    });
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Create FormData for file upload
      const formData = new FormData();

      // Append playlist fields
      formData.append("title", values.title);
      if (values.subtitle) {
        formData.append("subtitle", values.subtitle);
      }
      if (values.description) {
        formData.append("description", values.description);
      }
      formData.append("structure", values.structure);
      formData.append("status", values.status);
      formData.append(
        "data",
        JSON.stringify({ order: values.order === "order" ? true : false })
      );

      // Handle cover_image file if present (only if user uploaded a new file)
      if (coverImageFile?.originFileObj instanceof File) {
        formData.append("cover_image", coverImageFile.originFileObj);
      }

      onClose(
        {
          playlist: formData,
          tracks: selectedItems.map((item) => ({
            playlist: "",
            relation_type:
              String(item.label).split(" %% ")[1] === "trip"
                ? "inventory"
                : String(item.label).split(" %% ")[1],
            relation_id: item.value,
            sort_index: item.sort_index,
          })),
          originalPlaylist: playlist,
          originalTracks: tracks,
          isUpdate: isValidString(isOpen[1]),
        },
        isOpen[0]
      );
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  useEffect(() => {
    if (isValidString(isOpen[0])) {
      form.resetFields();
      setSelectedItems([]);
      setCoverImageFile(null);
      setIsImageError(false);
      removePlaylist();
      removeTracks();
      removeQueryResults();
    }
  }, [isOpen]);

  return (
    <Drawer
      title={
        isValidString(isOpen[1])
          ? `Update ${playlist?.title || "Playlist"}`
          : "Add Playlist"
      }
      loading={
        isPlaylistLoading ||
        isPlaylistFetching ||
        isTracksLoading ||
        isTracksFetching
      }
      placement="right"
      onClose={onClose.bind(null, {}, "")}
      open={isValidString(isOpen[0])}
      width={420}
      extra={
        <Button onClick={onSubmit} type="primary">
          {isValidString(isOpen[1]) ? "Update" : "Add"}
        </Button>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Title" name="title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Subtitle" name="subtitle">
          <Input />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item
          label="Status"
          name="status"
          initialValue="active"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value="active">Active</Radio>
            <Radio value="inactive">Inactive</Radio>
            <Radio value="unpublished">Unpublished</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label="Structure"
          name="structure"
          initialValue="standard-horizontal-list"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            {structures?.map((s) => (
              <Radio key={s.value} value={s.value}>
                {s.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label="Order"
          name="order"
          initialValue="order"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value="order">In-Order</Radio>
            <Radio value="random">Random</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="Cover Image">
          <Upload
            onChange={(info) => {
              if (info.fileList.length > 0) {
                setCoverImageFile(info.fileList[0]);
                setIsImageError(false);
              } else {
                setCoverImageFile(null);
              }
            }}
            onRemove={() => {
              setCoverImageFile(null);
              return true;
            }}
            maxCount={1}
            beforeUpload={() => false}
            accept="image/*"
            showUploadList={true}
            fileList={coverImageFile ? [coverImageFile] : []}
          >
            <Button>Click to Upload</Button>
          </Upload>
          {isValidString(playlist?.cover_image) &&
            !coverImageFile &&
            !isImageError && (
              <Image
                onError={() => setIsImageError(true)}
                src={playlist?.cover_image}
                alt="Cover Image"
                className="mt-4"
                style={{ maxWidth: "200px" }}
              />
            )}
        </Form.Item>

        <Form.Item label="Select">
          <Select
            showSearch
            onSearch={handleSearchChange}
            placeholder="Destination, Trips, Zostel, Zo House, etc."
            defaultActiveFirstOption={false}
            suffixIcon={null}
            value={search}
            onSelect={handleSelect}
            optionRender={(option) => {
              const [name, type] = String(option.label).split(" %% ");
              return (
                <div className="flex flex-col">
                  <div>{name}</div>
                  <div className="text-xs text-zui-silver capitalize">
                    {type}
                  </div>
                </div>
              );
            }}
            loading={isLoading || isFetching}
            filterOption={false}
            notFoundContent={
              isLoading || isFetching ? <Spin size="small" /> : null
            }
            options={queryResults}
          />
        </Form.Item>
      </Form>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={selectedItems.map((item) => String(item.value))}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {selectedItems.map((item) => {
              const [name, type] = String(item.label).split(" %% ");
              return (
                <SortableItem
                  key={String(item.value)}
                  id={String(item.value)}
                  name={name}
                  type={type}
                  isDraggable={form.getFieldValue("order") !== "random"}
                  onRemove={handleRemoveItem}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </Drawer>
  );
};

export default AddPlaylistSidebar;
