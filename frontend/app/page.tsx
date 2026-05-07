"use client";

import React from 'react';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white px-6 pt-12 pb-10 flex flex-col">
      {/* 상단 언어 선택 버튼 */}
      <div className="flex justify-end mb-8">
        <button className="bg-primary text-white px-3 py-1 rounded-md text-xs font-bold">KOR</button>
      </div>

      <h1 className="text-2xl font-extrabold mb-10 text-gray-900">회원가입</h1>

      <div className="space-y-6 flex-grow">
        {/* 이메일 입력 */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">이메일</label>
          <input 
            type="email" 
            placeholder="name@example.com" 
            className="w-full border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* 비밀번호 입력 */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">비밀번호</label>
          <div className="relative">
            <input 
              type="password" 
              placeholder="Min. 8 characters" 
              className="w-full border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {/* 여기에 눈 모양 아이콘 추가 가능 */}
              👁️
            </button>
          </div>
        </div>

        {/* 가입하기 버튼 */}
        <button className="w-full bg-gray-300 text-white py-4 rounded-xl font-bold text-lg mt-4 cursor-not-allowed">
          가입하기
        </button>

        {/* 구분선 */}
        <div className="relative py-4 flex items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">간편 가입하기</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* 소셜 가입 버튼들 */}
        <div className="space-y-3">
          <button className="w-full border border-gray-300 py-4 rounded-xl font-medium flex items-center justify-center gap-2">
            <span className="text-xl">G</span> Google로 회원가입
          </button>
          <button className="w-full bg-[#1A1A1E] text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2">
            <span className="text-xl"></span> Apple로 회원가입
          </button>
        </div>
      </div>

      {/* 로그인 이동 */}
      <div className="text-center mt-10">
        <span className="text-gray-500 text-sm">계정이 있으신가요? </span>
        <Link href="/login" className="text-primary font-bold text-sm">로그인하기</Link>
      </div>
    </div>
  );
}