<script setup>
import {onMounted} from "vue";
import {useLoginStore} from "@/stores/login.js";
const loginStore = useLoginStore();

onMounted(() => {
  loginStore.test();
})
</script>

<template>
    <h1 class="text-6xl uppercase">Home</h1>
</template>

<style scoped>

</style>