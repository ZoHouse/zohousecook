import Icon, { IconName } from "@zo/assets/icons";

export interface IconCardProps {
  pattern?: any;
  icon: IconName;
  description: string;
  iconFill: string;
}

const IconCard: React.FC<IconCardProps> = ({
  description,
  iconFill,
  icon,
  pattern,
}) => {
  return (
    <div className="border border-zui-light bg-zui-lighter lg:h-[312px] p-4 lg:p-10 flex flex-col justify-between relative overflow-hidden">
      {pattern && (
        <img
          className="w-full h-full absolute inset-0 object-cover"
          src={pattern}
          alt=""
          height={312}
          width={290}
        />
      )}
      <Icon className="relative" name={icon} fill={iconFill} size={40} />
      <span className=" zui-text-1 mt-12 lg:mt-0 relative font-normal">
        {description}
      </span>
    </div>
  );
};

export default IconCard;
