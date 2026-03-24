import { Person } from "@mui/icons-material";
import Icon from "@zo/assets/icons";
import { GeneralObject } from "@zo/definitions/general";
import { isValidString } from "@zo/utils/string";
import { Avatar, Flex, Image, Space, Typography } from "antd";
import React, { useMemo } from "react";

const { Text } = Typography;

const DEFAULT_IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/42bd2fc9-7968-40e5-a9b9-77d33958ceae_20250116135406.svg";

interface QuoteTweetProps {
  data: GeneralObject;
  parentTweet: GeneralObject;
}

const QuoteTweet: React.FC<QuoteTweetProps> = ({ data, parentTweet }) => {
  const author = useMemo(() => {
    return parentTweet.content.tweet?.includes?.users?.find(
      (_user: GeneralObject) => _user.id === data.content.tweet?.author_id
    );
  }, [data, parentTweet]);

  const isFounder = useMemo(
    () => parentTweet.tweet_context?.author_ref_user?.membership === "founder",
    [parentTweet.tweet_context]
  );

  const text = useMemo(() => {
    let _text: string = data.content.tweet?.text;
    (data.content.tweet?.entities?.urls || []).forEach((url: GeneralObject) => {
      _text = data.content.tweet?.text.replace(url.url, "");
    });
    _text = _text?.replace(/\n+$/, "");
    return _text;
  }, [data]);

  const medias = useMemo(() => {
    if (data.content.tweet?.attachments?.media_keys?.length > 0) {
      return (
        parentTweet.content.tweet?.includes?.media?.filter(
          (media: GeneralObject) =>
            data.content.tweet?.attachments.media_keys.includes(media.media_key)
        ) || []
      );
    }
    return [];
  }, [data, parentTweet]);

  return (
    <div className="w-full bg-zui-lighter p-6 rounded">
      <Flex justify="space-between" align="start">
        <Space size="middle">
          <div className="relative">
            <Avatar
              size={40}
              icon={<Person fontSize="small" />}
              src={author?.profile_image_url}
            />
            {isFounder && (
              <Icon
                name="FounderBadgeBordered"
                size="20"
                className="absolute bottom-0 right-0"
              />
            )}
          </div>

          <Space direction="vertical" size={0}>
            <Text strong>{author?.name}</Text>
            <Text type="secondary">@{author?.username || "Zo User"}</Text>
          </Space>
        </Space>
      </Flex>

      <Flex gap="middle" className="mt-4">
        <div className="flex-1">
          <Text>{text}</Text>
        </div>
        {medias?.length > 0 && isValidString(medias[0].url) && (
          <Image
            width={200}
            src={medias[0].url}
            alt="Tweet media"
            style={{ objectFit: "cover" }}
            fallback={DEFAULT_IMAGE}
          />
        )}
      </Flex>
    </div>
  );
};

export default QuoteTweet;
