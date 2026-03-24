/* eslint-disable @next/next/no-img-element */
import { Loader } from "@zo/assets/lotties";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidString } from "@zo/utils/string";
import React, { useMemo, useState } from "react";
import { GalleryMedia } from "../../config";

interface MemeShowcaseProps {}

const MemeShowcase: React.FC<MemeShowcaseProps> = () => {
  const [offset, setOffset] = useState<number>(0);
  const [memeList, setMemeList] = useState<GalleryMedia[]>([]);

  const { data, isLoading, refetch } = useQueryApi<GeneralObject>(
    "GALLERY_MEDIA",
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled:
        isValidString(process.env.MEME_RELATION_TYPE) &&
        isValidString(process.env.MEME_RELATION_ID),

      onSuccess(data) {
        setMemeList((prev) => [...prev, ...(data.data.results || [])]);
        return data;
      },
    },
    `${process.env.MEME_RELATION_TYPE}/${process.env.MEME_RELATION_ID}/`,
    `offset=${offset}&limit=18`
  );


  const chunks = useMemo(() => {
    const chunkSize = Math.ceil(memeList.length / 3);
    
    const firstChunk = memeList.slice(0, chunkSize);
    const secondChunk = memeList.slice(chunkSize, chunkSize * 2);
    const thirdChunk = memeList.slice(chunkSize * 2);

    return [firstChunk, secondChunk, thirdChunk];
  }, [memeList]);

  const hasMoreMemes = useMemo(() => {
    return data?.data.next != null;
  }, [data?.data]);

  const handleLoadMoreMemes = () => {
    if (hasMoreMemes) {
      setOffset((prev) => prev + 9);
      refetch();
    }
  };

  return (
    <section className="mt-20 mb-10 md:my-32">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 md:px-32">
        {chunks.map((chunk, chunkIndex) => {
          return (
            <div
              key={chunkIndex}
              className="grid gap-4 place-self-start w-full mt-0"
            >
              {chunk.map((meme) => (
                <MemeCard key={meme.id} src={meme.url} />
              ))}
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader className="w-10 h-10" />
        </div>
      )}

      {hasMoreMemes && (
        <button
          onClick={handleLoadMoreMemes}
          className="border-2 border-zui-white rounded-full mx-auto flex px-4 py-2 mt-10 font-bold hover:bg-white hover:text-black"
        >
          More Fucking Vibes, Please
        </button>
      )}
    </section>
  );
};

interface MemeCardProps {
  src: string;
  alt?: string;
}

const MemeCard: React.FC<MemeCardProps> = ({ src, alt }) => {
  const isImage =
    src?.includes("png") ||
    src?.includes("jpg") ||
    src?.includes("jpeg") ||
    src?.includes("gif") ||
    src?.includes("blob");

  return (
    <div className="">
      {isImage ? (
        <img className="h-auto w-full object-contain" src={src} alt={alt} />
      ) : (
        <video
          className="h-auto w-full object-contain"
          autoPlay={true}
          loop
          muted
          playsInline
          src={src}
        />
      )}
    </div>
  );
};

export default MemeShowcase;
