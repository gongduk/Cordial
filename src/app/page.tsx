import { redirect } from "next/navigation";

// 루트 접근 시 점주 로그인으로 리다이렉트
export default function RootPage() {
  redirect("/login");
}
