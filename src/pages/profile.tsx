import React from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '../components/layout/MainLayout';
import ProfileRadarChart from '../components/profile/ProfileRadarChart';
import ProfileTimeline from '../components/profile/ProfileTimeline';
import { FollowSection } from '../components/profile/FollowSection';
import { BadgeCollection } from '../components/profile/BadgeCollection';
import { ExpCard } from '../components/profile/ExpCard';

export default function ProfilePage() {
  const router = useRouter();
  const { userId } = router.query;
  const userIdString = Array.isArray(userId) ? userId[0] : userId || '';

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <ExpCard userId={userIdString} />
              <BadgeCollection userId={userIdString} />
              <ProfileRadarChart userId={userIdString} />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <ProfileTimeline userId={userIdString} limit={10} />
              <FollowSection userId={userIdString} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
