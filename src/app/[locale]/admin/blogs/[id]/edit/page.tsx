"use client";

import React from "react";
import { useParams } from "next/navigation";
import BlogEditor from "@/components/admin/BlogEditor";

export default function EditBlogPage() {
  const params = useParams();
  const id = params?.id as string;

  return <BlogEditor initialBlogId={id} />;
}
