import moment from "moment";
import React from "react";

interface MonthlyChartProps {
  data: any;
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  const currentMonth = moment().format("MMM");
  const previousMonth = moment().subtract(1, "months").format("MMM");

  const chartData = [
    { label: previousMonth, value: data?.prev_data.total },
    { label: currentMonth, value: data?.total },
  ];

  const maxHeight = 95;
  const maxValue = Math.max(...chartData?.map((item: any) => item.value));

  return (
    <div className="flex items-end justify-center  ">
      {chartData.map((item, index) => (
        <div className="flex flex-col items-center mx-4  ">
          <div className="relative flex flex-col items-center ">
            <div
              style={{ height: `${(item.value / maxValue) * maxHeight}px` }}
              className={`flex flex-col items-center justify-end w-12   ${
                index === 0 ? "bg-zui-orange" : "bg-zui-green "
              }  relative`}
            >
              {item.value > 0 && (
                <span className="absolute  top-8  text-zui-dark text-xl font-bold">
                  {item.value}
                </span>
              )}
            </div>
            <div
              className={`flex border-t-4 border-dashed border-zui-dark flex-col items-center justify-end w-12 h-8 ${
                index === 0 ? "bg-zui-orange" : "bg-zui-green "
              }  relative`}
            >
              <div className="h-3 w-6 bg-zui-dark rounded-tl-full rounded-tr-full"></div>
            </div>
          </div>
          <span className="text-xl text-zui-silver mt-2">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default MonthlyChart;
