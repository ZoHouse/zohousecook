import { MouseEventHandler } from "react";

const CreateNewNodeButton: React.FC<{ onClick: () => void }> = ({
  onClick,
}) => {
  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    onClick();
  };
  return (
    <button
      onClick={handleClick}
      className="w-full py-3 text-sm font-medium text-center text-subtitle"
    >
      Create a new Node.
    </button>
  );
};

export default CreateNewNodeButton;
