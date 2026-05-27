// CSS 모듈 타입 선언
declare module "*.css" {
  const styles: Record<string, string>;
  export default styles;
}

// NextAuth 타입 확장
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
