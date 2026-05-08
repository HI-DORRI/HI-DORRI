"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

export default function SignupPage() {
  return (
    <main className="app-shell bg-white px-6 pb-10 pt-12">
      <div className="mb-8 flex justify-end">
        <button className="rounded-md bg-primary px-3 py-1 text-xs font-bold text-white">
          KOR
        </button>
      </div>

      <h1 className="mb-10 text-2xl font-extrabold text-gray-900">회원가입</h1>

      <div className="flex min-h-[calc(100dvh-180px)] flex-col">
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="w-full rounded-xl border border-gray-200 p-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700" htmlFor="password">
              비밀번호
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                className="w-full rounded-xl border border-gray-200 p-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                aria-label="비밀번호 보기"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                type="button"
              >
                <Eye size={18} />
              </button>
            </div>
          </div>

          <button
            className="mt-4 w-full cursor-not-allowed rounded-xl bg-gray-300 py-4 text-lg font-bold text-white"
            disabled
          >
            가입하기
          </button>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-gray-200" />
            <span className="mx-4 flex-shrink text-sm text-gray-400">간편 가입하기</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>

          <div className="space-y-3">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 py-4 font-medium">
              <span className="text-xl">G</span>
              Google로 회원가입
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A1A1E] py-4 font-medium text-white">
              <span className="text-xl">A</span>
              Apple로 회원가입
            </button>
          </div>
        </div>

        <div className="mt-10 text-center">
          <span className="text-sm text-gray-500">계정이 있으신가요? </span>
          <Link href="/login" className="text-sm font-bold text-primary">
            로그인하기
          </Link>
        </div>
      </div>
    </main>
  );
}
