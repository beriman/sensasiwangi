import React from "react";
import { Routes, Route } from "react-router-dom";
import ForumLayout from "../forum/ForumLayout";
import ForumCategories from "../forum/ForumCategories";
import ThreadList from "../forum/ThreadList";
import ThreadDetail from "../forum/ThreadDetail";
import NewThread from "../forum/NewThread";

export default function Forum() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ForumLayout
            title="Forum Komunitas Perfumer"
            subtitle="Diskusikan dan bagikan pengalaman Anda tentang parfum"
          >
            <ForumCategories />
          </ForumLayout>
        }
      />
      <Route
        path="/category/:categoryId"
        element={
          <ForumLayout>
            <ThreadList />
          </ForumLayout>
        }
      />
      <Route
        path="/thread/:threadId"
        element={
          <ForumLayout>
            <ThreadDetail />
          </ForumLayout>
        }
      />
      <Route
        path="/new-thread/:categoryId"
        element={
          <ForumLayout>
            <NewThread />
          </ForumLayout>
        }
      />
    </Routes>
  );
}
