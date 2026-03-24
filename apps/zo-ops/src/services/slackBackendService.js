import { environment } from "../environments/environment";

const API_URL = environment.apiUrl;

export const sendSlackMessage = async (channel, text, pinMessage = false, userId = null, broadcastId = null, template = null, variables = null) => {
  try {
    console.log("Sending message to - ", channel, userId ? "using user account" : "using bot account", broadcastId ? `(broadcast: ${broadcastId})` : "");

    const response = await fetch(`${API_URL}/api/slack/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        text,
        pinMessage,
        userId, // Pass userId to use user account if connected
        broadcastId, // Group messages by broadcast
        template, // Original template with {{variables}}
        variables, // Variables used for this message
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Response:", data);

    if (!data.success) {
      throw new Error(data.error || "Failed to send message");
    }

    return {
      success: true,
      ts: data.ts,
      channel: data.channel,
    };
  } catch (error) {
    console.error("Error sending Slack message:", error);
    throw error;
  }
};

/**
 * Send a Slack message with an optional file attachment
 * @param {string} channel - Slack channel ID
 * @param {string} text - Message text (optional if file is provided)
 * @param {File|null} file - File to attach (optional)
 * @param {boolean} pinMessage - Whether to pin the message
 * @param {string|null} userId - User ID for OAuth (to send from user account)
 * @param {string|null} broadcastId - Broadcast ID for grouping messages
 * @param {string|null} template - Original template with {{variables}}
 * @param {object|null} variables - Variables used for this message
 * @returns {Promise<{success: boolean, ts: string, channel: string, file?: object}>}
 */
export const sendSlackMessageWithFile = async (channel, text, file = null, pinMessage = false, userId = null, broadcastId = null, template = null, variables = null) => {
  try {
    console.log(
      "Sending message with file to -",
      channel,
      file ? `(file: ${file.name})` : "(no file)",
      userId ? "using user account" : "using bot account",
      broadcastId ? `(broadcast: ${broadcastId})` : ""
    );

    const formData = new FormData();
    formData.append("channel", channel);
    if (text) {
      formData.append("text", text);
    }
    if (file) {
      formData.append("file", file);
    }
    formData.append("pinMessage", pinMessage.toString());
    if (userId) {
      formData.append("userId", userId);
    }
    if (broadcastId) {
      formData.append("broadcastId", broadcastId);
    }
    if (template) {
      formData.append("template", template);
    }
    if (variables) {
      formData.append("variables", JSON.stringify(variables));
    }

    const response = await fetch(`${API_URL}/api/slack/message-with-file`, {
      method: "POST",
      body: formData,
      // Note: Don't set Content-Type header - browser will set it with boundary for FormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Response:", data);

    if (!data.success) {
      throw new Error(data.error || "Failed to send message with file");
    }

    return {
      success: true,
      ts: data.messageTs,
      channel: data.channel,
      file: data.file,
      pinned: data.pinned,
      sentFromUserAccount: data.sentFromUserAccount,
    };
  } catch (error) {
    console.error("Error sending Slack message with file:", error);
    throw error;
  }
};

// ============================================
// Message Management Functions
// ============================================

/**
 * Search for messages by text content
 * @param {string} query - Search query
 * @param {string|null} userId - User ID for filtering
 * @param {number} limit - Max results to return
 * @param {number} offset - Pagination offset
 * @returns {Promise<{success: boolean, messages: Array, total: number}>}
 */
export const searchSlackMessages = async (query, userId = null, limit = 100, offset = 0) => {
  try {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (userId) {
      params.append("userId", userId);
    }

    const response = await fetch(`${API_URL}/api/slack/messages/search?${params}`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to search messages");
    }

    return {
      success: true,
      messages: data.messages,
      total: data.total,
    };
  } catch (error) {
    console.error("Error searching Slack messages:", error);
    throw error;
  }
};

/**
 * List all messages sent through this tool
 * @param {string|null} channelId - Optional channel filter
 * @param {string|null} userId - User ID for filtering
 * @param {number} limit - Max results to return
 * @param {number} offset - Pagination offset
 * @returns {Promise<{success: boolean, messages: Array, total: number}>}
 */
export const listSlackMessages = async (channelId = null, userId = null, limit = 100, offset = 0) => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (channelId) {
      params.append("channelId", channelId);
    }
    if (userId) {
      params.append("userId", userId);
    }

    const response = await fetch(`${API_URL}/api/slack/messages/list?${params}`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to list messages");
    }

    return {
      success: true,
      messages: data.messages,
      total: data.total,
    };
  } catch (error) {
    console.error("Error listing Slack messages:", error);
    throw error;
  }
};

/**
 * Edit multiple messages
 * @param {Array<{channel: string, ts: string, newText: string}>} messages - Messages to edit
 * @param {string|null} userId - User ID for authentication
 * @returns {Promise<{success: boolean, results: Array, summary: object}>}
 */
export const editSlackMessages = async (messages, userId = null) => {
  try {
    const response = await fetch(`${API_URL}/api/slack/messages/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error editing Slack messages:", error);
    throw error;
  }
};

/**
 * Delete multiple messages
 * @param {Array<{channel: string, ts: string}>} messages - Messages to delete
 * @param {string|null} userId - User ID for authentication
 * @returns {Promise<{success: boolean, results: Array, summary: object}>}
 */
export const deleteSlackMessages = async (messages, userId = null) => {
  try {
    const response = await fetch(`${API_URL}/api/slack/messages/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting Slack messages:", error);
    throw error;
  }
};

// ============================================
// Broadcast Functions
// ============================================

/**
 * Generate a new broadcast ID for grouping messages
 * @returns {Promise<{success: boolean, broadcastId: string}>}
 */
export const generateBroadcastId = async () => {
  try {
    const response = await fetch(`${API_URL}/api/slack/broadcast/new`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error generating broadcast ID:", error);
    throw error;
  }
};

/**
 * List messages with broadcast grouping
 * @param {string|null} channelId - Optional channel filter
 * @param {string|null} userId - User ID for filtering
 * @param {number} limit - Max results to return
 * @param {number} offset - Pagination offset
 * @returns {Promise<{success: boolean, messages: Array, total: number, broadcasts: Array}>}
 */
export const listSlackMessagesWithBroadcasts = async (channelId = null, userId = null, limit = 100, offset = 0, startDate = null, endDate = null) => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      groupByBroadcast: 'true',
    });
    if (channelId) {
      params.append("channelId", channelId);
    }
    if (userId) {
      params.append("userId", userId);
    }
    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }

    const response = await fetch(`${API_URL}/api/slack/messages/list?${params}`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to list messages");
    }

    return {
      success: true,
      messages: data.messages,
      total: data.total,
      broadcasts: data.broadcasts || [],
    };
  } catch (error) {
    console.error("Error listing Slack messages with broadcasts:", error);
    throw error;
  }
};

/**
 * Edit a broadcast (re-apply template with variables to all messages)
 * @param {string} broadcastId - Broadcast ID
 * @param {string} newTemplate - New template with {{variables}}
 * @param {string|null} userId - User ID for authentication
 * @returns {Promise<{success: boolean, results: Array, summary: object}>}
 */
export const editBroadcast = async (broadcastId, newTemplate, userId = null) => {
  try {
    const response = await fetch(`${API_URL}/api/slack/broadcast/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        broadcastId,
        newTemplate,
        userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error editing broadcast:", error);
    throw error;
  }
};
