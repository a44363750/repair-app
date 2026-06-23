<template>
  <div class="login-container">
    <div class="login-box">
      <h1>生产设备报修系统</h1>
      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            :loading="loading" 
            style="width: 100%"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

// 初始化 store 状态
userStore.token = localStorage.getItem('token')
userStore.user = JSON.parse(localStorage.getItem('user') || 'null')

const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await formRef.value.validate()
  loading.value = true
  
  try {
    console.log('开始登录:', form.username, form.password)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: form.username, password: form.password})
    })
    const data = await res.json()
    console.log('登录响应:', res.status, data)
    
    console.log('检查 res.ok:', res.ok, 'status:', res.status)
    if (!res.ok) {
      console.log('失败原因:', data)
      throw new Error(data.detail || '登录失败 ' + res.status)
    }
    
    localStorage.setItem('token', data.access_token)
    userStore.token = data.access_token
    
    // 获取用户信息
    const meRes = await fetch('/api/auth/me', {
      headers: {'Authorization': `Bearer ${data.access_token}`}
    })
    const meData = await meRes.json()
    console.log('用户信息:', meData)
    localStorage.setItem('user', JSON.stringify(meData))
    userStore.user = meData
    
    ElMessage.success('登录成功')
    console.log('准备跳转...')
    router.push('/').then(() => {
      console.log('跳转完成')
    }).catch(err => {
      console.error('跳转失败:', err)
    })
  } catch (error) {
    console.error('登录错误:', error)
    ElMessage.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.login-box h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
}

</style>