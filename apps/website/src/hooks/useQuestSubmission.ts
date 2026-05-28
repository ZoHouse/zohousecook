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

// CAS accepts the file under the `file` part and gates the post on the
// `category` field (cas/views/gallery.py uses
// @params_present("category","file") on the MediaRelations endpoint and the
// MediaSerializer requires it on the ViewSet). Both endpoints currently sit
// behind staff/CAS-admin permissions — non-staff users will 403 here until
// the backend opens a user-scoped upload path; this hook is plumbed and
// ready for that day. Content-Type is set by zoServer's request interceptor
// (libs/auth/src/utils.ts) based on FormData detection, so we don't pass it
// explicitly.
async function uploadProofMedia(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "category",
    file.type.startsWith("video") ? "video" : "image",
  );
  const res = await zoServer.post<CasMediaResponse>(
    "/api/v1/cas/media/",
    formData,
  );
  const id = res.data?.id ?? res.data?.pid;
  if (!id) throw new Error("CAS upload returned no media id");
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
