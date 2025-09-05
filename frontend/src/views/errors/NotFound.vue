<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
    <div class="mx-auto max-w-max">
      <main class="sm:flex">
        <p class="text-4xl font-bold tracking-tight text-primary-600 dark:text-primary-400 sm:text-5xl">
          404
        </p>
        <div class="sm:ml-6">
          <div class="sm:border-l sm:border-gray-200 dark:sm:border-gray-700 sm:pl-6">
            <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              页面未找到
            </h1>
            <p class="mt-1 text-base text-gray-500 dark:text-gray-400">
              请检查地址栏中的 URL 并重试。
            </p>
          </div>
          <div class="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
            <router-link
              to="/"
              class="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
            >
              返回首页
            </router-link>
            <button
              type="button"
              class="inline-flex items-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="$router.go(-1)"
            >
              返回
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>