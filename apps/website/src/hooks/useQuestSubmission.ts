import { useMutation, useQueryClient } from "react-query";
import { zoServer } from "../../../../libs/auth/src/utils";

export interface QuestSubmissionInput {
  file?: File;
  proofUrl?: string;
  bookingRefId?: string;
  latitude?: number;
  longitude?: number;
}

interface CasMediaResponse {
  id?: string;
  pid?: string;
  [key: string]: unknown;
}

// Posts to /api/v1/gallery/media/ — Daya's user-scoped upload endpoint
// (gallery/views.py MediaUploadView with `permission_classes = []`, so any
// authenticated user can hit it). Required form fields per the
// @params_present("category", "file") decorator: `category` (string,
// "image" or "video" derived from File.type) and `file` (the binary).
// Returns 201 with the MediaSerializer payload; we read `id` to attach
// as proof_media[]. Note: we used to point at /api/v1/cas/media/ which was
// staff-gated (IsHousekeepingStaff | IsHousekeepingAdmin | IsCASAdmin) —
// non-staff users 403'd there; the gallery endpoint is the user-facing one.
async function uploadProofMedia(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "category",
    file.type.startsWith("video") ? "video" : "image",
  );
  const res = await zoServer.post<CasMediaResponse>(
    "/api/v1/gallery/media/",
    formData,
  );
  const id = res.data?.id ?? res.data?.pid;
  if (!id) throw new Error("gallery upload returned no media id");
  return String(id);
}

// Drives POST /api/v1/passport/quests/<slug>/submission/. Handles the
// optional CAS upload + the JSON submission as one mutation so the caller
// only awaits a single promise. On success, invalidates the quests cache so
// the QuestsDock re-renders with the updated participation status.
export function useQuestSubmission(slug: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation(async (input: QuestSubmissionInput) => {
    if (!slug) throw new Error("Quest slug missing");

    const body: Record<string, unknown> = {};
    if (input.file) {
      const mediaId = await uploadProofMedia(input.file);
      body.proof_media = [mediaId];
    }
    if (input.proofUrl) body.proof_url = input.proofUrl;
    if (input.bookingRefId) body.booking_ref_id = input.bookingRefId;
    if (input.latitude != null) body.latitude = input.latitude;
    if (input.longitude != null) body.longitude = input.longitude;

    const res = await zoServer.post(
      `/api/v1/passport/quests/${encodeURIComponent(slug)}/submission/`,
      body,
    );
    return res.data;
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries(["passport", "quests"]);
    },
  });
}
