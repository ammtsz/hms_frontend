import React from "react";

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  height = "h-4",
  width = "w-full",
  rounded = false,
}) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${height} ${width} ${
        rounded ? "rounded-full" : "rounded"
      } ${className}`}
    />
  );
};
