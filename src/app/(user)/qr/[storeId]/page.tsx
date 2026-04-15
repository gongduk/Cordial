"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  params: { storeId: string };
}

export default function QREntryPage({ params }: Props) {
  const router = useRouter();
  const { storeId } = params;

  useEffect(() => {
    // storeId를 세션에 저장 후 감정 입력 페이지로 이동
    sessionStorage.setItem("storeId", storeId);
    router.replace("/emotion");
  }, [storeId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-teal-400 animate-pulse">로딩 중...</p>
    </div>
  );
}
