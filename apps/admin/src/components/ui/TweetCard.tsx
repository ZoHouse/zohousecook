import {
  BookmarkBorderOutlined,
  ChatBubbleOutlineOutlined,
  FavoriteOutlined,
  OpenInNewOutlined,
  PeopleOutlineOutlined,
  Person,
  RepeatOutlined,
  ReplyOutlined,
} from "@mui/icons-material";
import Icon from "@zo/assets/icons";
import { GeneralObject } from "@zo/definitions/general";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import {
  Avatar,
  Card,
  Flex,
  Image,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import moment from "moment";
import React, { useMemo } from "react";
import { CASBulletinsResponse, PublicMetrics } from "../../config";
import QuoteTweet from "./QuoteTweet";

const { Text } = Typography;

const DEFAULT_IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/42bd2fc9-7968-40e5-a9b9-77d33958ceae_20250116135406.svg";

interface TweetCardProps {
  data: CASBulletinsResponse;
  onStatusChange: (value: boolean, data: GeneralObject | undefined) => void;
}

const metricIcons = {
  like_count: <FavoriteOutlined fontSize="small" />,
  quote_count: <ChatBubbleOutlineOutlined fontSize="small" />,
  retweet_count: <RepeatOutlined fontSize="small" />,
  reply_count: <ReplyOutlined fontSize="small" />,
  bookmark_count: <BookmarkBorderOutlined fontSize="small" />,
  impression_count: <PeopleOutlineOutlined fontSize="small" />,
};

const TweetCard: React.FC<TweetCardProps> = ({ data, onStatusChange }) => {
  const author = useMemo(() => {
    return data.content.tweet?.includes?.users?.find(
      (_user: GeneralObject) => _user.id === data.content.tweet?.author_id
    );
  }, [data]);

  const isFounder = useMemo(
    () => data.tweet_context?.author_ref_user?.membership === "founder",
    [data.tweet_context]
  );

  const quotedTweet = useMemo(() => {
    if (data.content.tweet?.referenced_tweets != null) {
      const quotedTweetId = data.content.tweet?.referenced_tweets?.find(
        (tweet: GeneralObject) => tweet.type === "quoted"
      )?.id;
      if (quotedTweetId != null) {
        return data.content.tweet?.includes?.tweets?.find(
          (tweet: GeneralObject) => tweet.id === quotedTweetId
        );
      }
    }
    return null;
  }, [data]);

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
      return data.content.tweet?.includes?.media.filter(
        (media: GeneralObject) =>
          data.content.tweet?.attachments.media_keys.includes(media.media_key)
      );
    }
    return [];
  }, [data]);

  const url = useMemo(() => {
    if (
      data.content.tweet?.entities?.urls?.length > 0 &&
      data.content.tweet?.entities?.urls?.find(
        (u: GeneralObject) => u.display_url != null && u.status != null
      )
    ) {
      return data.content.tweet?.entities?.urls?.find(
        (u: GeneralObject) => u.display_url != null && u.status != null
      );
    }
    return null;
  }, [data]);

  const openTweet = () => {
    window.open(
      `https://x.com/${author?.username}/status/${data.content.tweet?.conversation_id}`,
      "_blank"
    );
  };

  const metrics: PublicMetrics = useMemo(() => {
    return data.content?.tweet?.public_metrics;
  }, [data]);

  return (
    <Card className="w-full md:w-3/4">
      <Flex justify="space-between" align="start">
        <Space size="middle" onClick={openTweet} style={{ cursor: "pointer" }}>
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
            <Text className="hover:text-zui-neon" strong>
              {author?.name}
            </Text>
            <Text type="secondary">@{author?.username}</Text>
          </Space>

          <OpenInNewOutlined fontSize="small" />

          <Space size="large">
            {isValidString(data.created_at) && (
              <Space direction="vertical" size={0}>
                <Text strong>Created At</Text>
                <Text type="secondary">
                  {moment(data.created_at).format("lll")}
                </Text>
              </Space>
            )}
            {isValidString(data.updated_at) && (
              <Space direction="vertical" size={0}>
                <Text strong>Updated At</Text>
                <Text type="secondary">
                  {moment(data.updated_at).format("lll")}
                </Text>
              </Space>
            )}
          </Space>
        </Space>

        <Switch
          checked={data.status === "published"}
          onChange={(checked) => onStatusChange(checked, { id: data.id })}
        />
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

      {isValidObject(metrics) && (
        <Space wrap className="mt-4 p-3 border border-gray-700 rounded">
          {Object.entries(metrics).map(([key, value]) => (
            <Tooltip key={key} title={formatCapitalize(key)}>
              <Tag>
                <Space>
                  {metricIcons[key as keyof typeof metricIcons]}
                  <Text>{value || 0}</Text>
                </Space>
              </Tag>
            </Tooltip>
          ))}
        </Space>
      )}

      {quotedTweet && (
        <div className="mt-4">
          <QuoteTweet
            data={{
              content: {
                tweet: quotedTweet,
              },
            }}
            parentTweet={data}
          />
        </div>
      )}
    </Card>
  );
};

export default TweetCard;
