import * as Sentry from "@sentry/nextjs";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { Button, Drawer, Form, Input, message } from "antd";
import React, { useState } from "react";
import { Activity } from "./ActivityCell";
import ActivitiesMediaManager, { ActivityMedia } from "./ActivityMediaManager";

interface ActivityEditSidebarProps {
  isModalOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedOperator: GeneralObject;
  activityToEdit?: GeneralObject;
}

const ActivityEditSidebar: React.FC<ActivityEditSidebarProps> = ({
  isModalOpen,
  onClose,
  onSuccess,
  selectedOperator,
  activityToEdit,
}) => {
  const [form] = Form.useForm<{
    name: string;
    description: string;
  }>();

  const { mutate: createActivity } = useMutationApi("CAS_PM_INVENTORY");
  const { mutate: updateActivity } = useMutationApi(
    "CAS_PM_INVENTORY",
    {},
    "",
    "PUT"
  );

  const { mutateAsync: uploadMedia, isLoading: isMediaUploadLoading } =
    useMutationApi("CAS_PM_MEDIA_INVENTORY");

  const { mutateAsync: updateMedia } = useMutationApi(
    "CAS_PM_MEDIA_INVENTORY",
    {},
    "",
    "PUT"
  );

  const { mutateAsync: deleteMedia } = useMutationApi(
    "CAS_PM_MEDIA_INVENTORY",
    {},
    "",
    "DELETE"
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        // Guard: ensure operator present
        if (!selectedOperator?.code) {
          message.error("Please select an operator before saving");
          setIsSubmitting(false);
          return;
        }

        if (media.length < 4) {
          message.info(
            "A minimum of 4 real-life pictures and videos is required to submit. Posters or graphics will not be approved. Please upload 4 real-life pictures to proceed with submission."
          );
          setIsSubmitting(false);
          return;
        }

        const isEdit = !!activityToEdit?.id;

        const activityPayload: Activity = {
          category: "open-irl",
          type: "activity",
          status: "pending",
          name: values.name,
          description: values.description,
        };

        try {
          if (!isEdit) {
            const created = await new Promise<{ data: { id: string } }>(
              (resolve, reject) =>
                createActivity(
                  {
                    data: {
                      operator: selectedOperator?.code,
                      tax_category: "inclusive",
                      ...activityPayload,
                    },
                  },
                  { onSuccess: resolve, onError: reject }
                )
            );

            const newId = created.data.id;

            await Promise.all(
              media.map((m, idx) => {
                const fd = new FormData();
                if (m.file) fd.append("file", m.file);
                if (m.name) fd.append("name", m.name);
                if (m.status) fd.append("status", m.status);
                if (m.category) fd.append("category", m.category);
                // Recompute unique sort_index based on position: earlier → higher value
                const si = media.length - idx;
                fd.append("sort_index", String(si));
                return uploadMedia({
                  data: fd as unknown as GeneralObject,
                  route: `${newId}/`,
                });
              })
            );

            message.success("Activity submitted for approval.");
            setIsSubmitting(false);
            onSuccess();
            onClose();
          } else {
            // Update activity fields
            await new Promise((resolve, reject) =>
              updateActivity(
                {
                  route: `${activityToEdit.id}/`,
                  data: {
                    name: activityPayload.name,
                    description: activityPayload.description,
                    status: "pending",
                  },
                },
                { onSuccess: resolve, onError: reject }
              )
            );

            // Diff media
            const originalMedia: GeneralObject[] = Array.isArray(
              activityToEdit.media
            )
              ? (activityToEdit.media as GeneralObject[])
              : [];
            // For deletions, compare relation ids and delete by relation id
            const originalRelationIds = new Set<string>(
              originalMedia
                .filter((m) => m.media_relation_id)
                .map((m) => String(m.media_relation_id))
            );
            const currentRelationIds = new Set<string>(
              media
                .filter((m) => !m.file && m.media_relation_id)
                .map((m) => String(m.media_relation_id))
            );

            const toDelete = [...originalRelationIds].filter(
              (rid) => !currentRelationIds.has(rid)
            );
            await Promise.all(
              toDelete.map((rid) =>
                deleteMedia({ data: {}, route: `${activityToEdit.id}/${rid}/` })
              )
            );

            const newlyAdded = media
              .map((m, idx) => ({ m, idx }))
              .filter(({ m }) => m.file);
            if (newlyAdded.length > 0) {
              await Promise.all(
                newlyAdded.map(({ m, idx }) => {
                  const fd = new FormData();
                  if (m.file) fd.append("file", m.file);
                  if (m.name) fd.append("name", m.name);
                  if (m.status) fd.append("status", m.status);
                  if (m.category) fd.append("category", m.category);
                  // Recompute unique sort_index based on position: earlier → higher value
                  const si = media.length - idx;
                  fd.append("sort_index", String(si));
                  return uploadMedia({
                    data: fd as unknown as GeneralObject,
                    route: `${activityToEdit.id}/`,
                  });
                })
              );
            }

            // Update sort_index and/or status for existing media keyed by media_relation_id
            type MediaMeta = { sort_index: number; status?: string };
            const originalByRelation: Record<string, MediaMeta> = {};
            originalMedia.forEach((m, idx) => {
              if (m.media_relation_id)
                originalByRelation[String(m.media_relation_id)] = {
                  sort_index: Number((m as GeneralObject).sort_index) ?? idx,
                  status: (m.status as string) || undefined,
                };
            });
            const currentByRelation: Record<string, MediaMeta> = {};
            media.forEach((m, idx) => {
              if (m.media_relation_id)
                currentByRelation[String(m.media_relation_id)] = {
                  // Recompute desired sort_index from current order to enforce uniqueness
                  sort_index: media.length - idx,
                  status: (m.status as string) || undefined,
                };
            });
            const relationIds = Object.keys(originalByRelation).filter((k) =>
              Object.prototype.hasOwnProperty.call(currentByRelation, k)
            );
            if (relationIds.length > 0) {
              await Promise.all(
                relationIds.map((rid) => {
                  const before = originalByRelation[rid];
                  const after = currentByRelation[rid];
                  const payload: Record<string, unknown> = {};
                  if (before.sort_index !== after.sort_index)
                    payload.sort_index = after.sort_index;
                  if (before.status !== after.status)
                    payload.status = after.status;
                  if (Object.keys(payload).length === 0)
                    return Promise.resolve();
                  return updateMedia({
                    data: payload as unknown as GeneralObject,
                    route: `${activityToEdit.id}/${rid}/`,
                  });
                })
              );
            }

            message.success("Activity updated.");
            setIsSubmitting(false);
            onSuccess();
            onClose();
          }
        } catch (error) {
          setIsSubmitting(false);
          Sentry.captureException(error);
          message.error(processResponseError(error));
        }
      })
      .catch(() => {});
  };

  const [media, setMedia] = useState<ActivityMedia[]>([]);

  // Prefill when editing
  React.useEffect(() => {
    if (!isModalOpen) return;
    if (activityToEdit?.id) {
      form.setFieldsValue({
        name: (activityToEdit.name as string) || "",
        description: (activityToEdit.description as string) || "",
      });
      const serverMedia: GeneralObject[] = Array.isArray(activityToEdit.media)
        ? (activityToEdit.media as GeneralObject[])
        : [];
      setMedia(
        serverMedia.map((m) => ({
          id: String(m.id),
          url: (m.url as string) || "",
          name: (m.name as string) || "",
          status: (m.status as string as "active" | "inactive") || "inactive",
          media_relation_id: String(m.media_relation_id),
          sort_index: Number((m as GeneralObject).sort_index) || undefined,
        }))
      );
    } else {
      form.resetFields();
      setMedia([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, activityToEdit?.id]);

  return (
    <Drawer
      title={activityToEdit?.id ? "Edit Activity" : "Add Activity"}
      open={isModalOpen}
      onClose={isSubmitting ? () => {} : onClose}
      width={560}
      maskClosable={!isSubmitting}
      closable={!isSubmitting}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting || isMediaUploadLoading}
            disabled={isSubmitting}
          >
            Submit for Approval
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" className="pb-20 flex flex-col gap-4">
        <Form.Item
          label="Activity Name"
          name="name"
          className="mb-0"
          rules={[{ required: true, message: "Please enter activity name" }]}
        >
          <Input placeholder="Sunrise Hike" />
        </Form.Item>
        <Form.Item
          label="Activity Description"
          name="description"
          className="mb-0"
          rules={[
            { required: true, message: "Please enter activity description" },
          ]}
        >
          <Input.TextArea
            placeholder="A guided hike to the summit to watch the sunrise. Suitable for all fitness levels. Bring water and a light jacket."
            rows={4}
          />
        </Form.Item>

        <Form.Item label="Media" required>
          <ActivitiesMediaManager
            status="inactive"
            value={media}
            onChange={setMedia}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default ActivityEditSidebar;
