<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold">测试页面</h1>
    <p>如果你看到这个页面，说明Vue组件可以正常渲染。</p>
    <button @click="test" class="bg-blue-500 text-white px-4 py-2 mt-4 rounded">
      测试按钮
    </button>
  </div>
</template>

<script setup>
const test = () => {
  alert('按钮工作正常！')
}

console.log('MinimalTest component loaded')
</script>