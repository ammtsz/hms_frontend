import React from "react";
import { Skeleton } from "@/components/common/SkeletonLoading";
import { Card, CardBody } from "@/components/ui";

interface PatientDetailSkeletonProps {
  showCards?: boolean;
}

export const PatientDetailSkeleton: React.FC<PatientDetailSkeletonProps> = ({
  showCards = true,
}) => {
  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto w-full">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-6 w-64" />
        </div>

        {/* Header Card Skeleton */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-8 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                </div>
                <Skeleton className="h-11 w-full sm:h-10 sm:w-24" />
              </div>
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-full max-w-lg" />
              </div>
            </div>
          </CardBody>
        </Card>

        {showCards && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Treatment Card */}
              <Card>
                <CardBody>
                  <Skeleton className="h-6 w-48 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardBody>
              </Card>

              {/* Attendance History Card */}
              <Card>
                <CardBody>
                  <Skeleton className="h-6 w-56 mb-4" />
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Skeleton className="h-3 w-3" rounded />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Future Appointments Card */}
              <Card>
                <CardBody>
                  <Skeleton className="h-6 w-48 mb-4" />
                  <div className="space-y-4">
                    {[1, 2].map((item) => (
                      <div key={item} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-3 w-3" rounded />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Right Column Cards */}
            <div className="space-y-6">
              {/* Patient Notes Card */}
              <Card>
                <CardBody>
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardBody>
              </Card>

              {/* Status Overview Card */}
              <Card>
                <CardBody>
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
