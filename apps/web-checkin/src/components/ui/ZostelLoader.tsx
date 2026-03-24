import Image from "next/image";

interface ZostelLoaderProps {
  isLoading: boolean;
  size?: number;
}

const ZostelLoader: React.FC<ZostelLoaderProps> = ({
  isLoading,
  size = 64,
}) => {
  if (!isLoading) return null;

  return (
    isLoading && (
      <div className="h-full flex-1 flex items-center justify-center">
        <Image
          src={
            "https://cdn.zo.xyz/gallery/media/images/46bc5ba2-ee99-4158-a804-2fa2589e664b_20241128083835.svg"
          }
          width={size}
          height={size}
          alt="zostel loader"
          priority
          style={{
            height: size,
            width: size,
          }}
          className="zostel-loader-animation"
        />
      </div>
    )
  );
};

export default ZostelLoader;
