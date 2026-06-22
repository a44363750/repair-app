<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="logo">设备报修系统</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon><span>首页</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon><span>基本设置</span>
        </el-menu-item>
        <el-menu-item index="/equipment">
          <el-icon><Monitor /></el-icon><span>设备信息</span>
        </el-menu-item>
        <el-menu-item index="/report">
          <el-icon><Warning /></el-icon><span>我要报修</span>
        </el-menu-item>
        <el-menu-item index="/dispatch">
          <el-icon><Operation /></el-icon><span>维修调度</span>
        </el-menu-item>
        <el-menu-item index="/maintenance-staff">
          <el-icon><UserFilled /></el-icon><span>维修人员</span>
        </el-menu-item>
        <el-menu-item index="/repair-query">
          <el-icon><Search /></el-icon><span>报修查询</span>
        </el-menu-item>
        <el-menu-item index="/repair-history">
          <el-icon><Document /></el-icon><span>维修查询</span>
        </el-menu-item>
        <el-menu-item index="/materials">
          <el-icon><Box /></el-icon><span>维修耗材</span>
        </el-menu-item>
        <el-menu-item index="/work-hours">
          <el-icon><Clock /></el-icon><span>工时统计</span>
        </el-menu-item>
        <el-menu-item index="/dispatchers">
          <el-icon><Grid /></el-icon><span>调度人员</span>
        </el-menu-item>
        <el-menu-item index="/timely-rate">
          <el-icon><DataLine /></el-icon><span>维修及时率</span>
        </el-menu-item>
        <el-menu-item index="/requisitions">
          <el-icon><Tickets /></el-icon><span>物资领用</span>
        </el-menu-item>
        <el-menu-item index="/purchase-requests">
          <el-icon><ShoppingCart /></el-icon><span>资产采购</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header>
        <div class="header-right">
          <span class="username">{{ userStore.userName }}</span>
          <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main><router-view /></el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'
import {
  DataAnalysis, Setting, Monitor, Warning, Operation, UserFilled,
  Search, Document, Box, Clock, Grid, DataLine, Tickets, ShoppingCart
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const activeMenu = computed(() => route.path)

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => { userStore.logout(); router.push('/login') })
}
</script>

<style scoped>
.layout-container { height: 100vh; }
.el-aside { background-color: #304156; }
.logo {
  height: 60px; line-height: 60px; text-align: center;
  color: #fff; font-size: 16px; font-weight: bold;
  border-bottom: 1px solid #3a4a5c;
}
.el-header {
  background: white;
  display: flex; align-items: center; justify-content: flex-end;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}
.header-right { display: flex; align-items: center; gap: 12px; }
.username { color: #333; font-weight: 500; }
.el-main { background: #f5f7fa; padding: 16px; }
</style>
