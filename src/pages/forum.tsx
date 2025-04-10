import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { ForumLayout } from '../components/forum/ForumLayout';
import { ForumThreadList } from '../components/forum/ForumThreadList';
import { ForumCategoryList } from '../components/forum/ForumCategoryList';

export default function ForumPage() {
  return (
    <MainLayout>
      <ForumLayout>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <ForumCategoryList />
          </div>
          <div className="md:col-span-3">
            <ForumThreadList />
          </div>
        </div>
      </ForumLayout>
    </MainLayout>
  );
}
