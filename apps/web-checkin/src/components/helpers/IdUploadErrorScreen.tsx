import Image from "next/image";

export const IdUploadErrorScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <Image
        src="https://cdn.zo.xyz/gallery/media/images/2f9f8749-f40c-46ce-a30a-e9b28193f370_20250312095859.png"
        alt="ID Upload Error"
        width={400}
        height={400}
        className="w-full object-contain px-10"
      />
      <div className="px-4">
        <h2 className="mobile-title text-center">
          Still not working? Check-in at reception!
        </h2>
        <p className="text-center body-text mt-3">
          Tech can be tricky, but your journey shouldn’t stop here! 😃
        </p>
      </div>
    </div>
  );
};

export default IdUploadErrorScreen;
