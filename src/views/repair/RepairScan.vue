<template>
  <div class="scan-page">
    <div class="scan-container">
      <!-- 顶部 Logo 区 -->
      <div class="scan-header">
        <h1>🏭 生产设备报修系统</h1>
        <p class="scan-subtitle">扫码报修 · 快速响应</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="status-card loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在查询设备信息...</span>
      </div>

      <!-- 设备不存在 -->
      <div v-else-if="notFound" class="status-card error">
        <div class="status-icon">❌</div>
        <h2>设备未找到</h2>
        <p>资产编号：<strong>{{ queryCode }}</strong></p>
        <p class="tips">此设备尚未录入系统，请联系管理员添加。</p>
      </div>

      <!-- 设备信息 + 报修表单 -->
      <div v-else-if="asset" class="content-card">
        <!-- 设备信息区 -->
        <div class="asset-info">
          <div class="asset-title">设备信息</div>
          <div class="info-grid">
            <div class="info-row">
              <span class="label">资产编号</span>
              <span class="value code">{{ asset.asset_code }}</span>
            </div>
            <div class="info-row">
              <span class="label">资产名称</span>
              <span class="value">{{ asset.name }}</span>
            </div>
            <div class="info-row">
              <span class="label">规格型号</span>
              <span class="value">{{ asset.model || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">使用人员</span>
              <span class="value">{{ asset.user_name || asset.used_by || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">存放地点</span>
              <span class="value">{{ asset.location || '-' }}</span>
            </div>
            <div class="info-row" v-if="asset.category_name">
              <span class="label">资产分类</span>
              <span class="value">{{ asset.category_name }}</span>
            </div>
          </div>
        </div>

        <!-- 报修表单区 -->
        <div class="repair-form" v-if="!submitted">
          <div class="form-title">报修申请</div>
          <el-form :model="form" :rules="rules" ref="formRef" label-width="90px" @submit.prevent="handleSubmit">
            <el-form-item label="故障描述" prop="fault_description">
              <el-input
                v-model="form.fault_description"
                type="textarea"
                :rows="4"
                placeholder="请详细描述设备故障现象"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="紧急程度" prop="urgency_level">
              <el-radio-group v-model="form.urgency_level">
                <el-radio value="low">低</el-radio>
                <el-radio value="normal">普通</el-radio>
                <el-radio value="high">高</el-radio>
                <el-radio value="urgent">紧急</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="报修人" prop="reporter_name">
              <el-input v-model="form.reporter_name" placeholder="请输入您的姓名" maxlength="50" />
            </el-form-item>

            <el-form-item label="联系电话" prop="reporter_contact">
              <el-input v-model="form.reporter_contact" placeholder="请输入联系电话" maxlength="20" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit" style="width: 100%">
                提交报修
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 提交成功 -->
        <div v-else class="success-panel">
          <div class="success-icon">✅</div>
          <h2>报修提交成功！</h2>
          <p>报修单号：<strong>{{ submittedId }}</strong></p>
          <p>我们将尽快安排人员处理，请保持电话畅通。</p>
          <el-button type="primary" @click="resetForm" style="margin-top: 20px">继续报修</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import api from '../../api'

// 使用公开接口查询资产（无需认证）
const assetApiPublic = {
  getByCode: (code) => api.get(`/assets/public/code/${code}`)
}

const route = useRoute()

const loading = ref(true)
const notFound = ref(false)
const asset = ref(null)
const queryCode = ref('')
const submitted = ref(false)
const submittedId = ref(null)
const submitting = ref(false)
const formRef = ref()

const form = reactive({
  fault_description: '',
  urgency_level: 'normal',
  reporter_name: '',
  reporter_contact: ''
})

const rules = {
  fault_description: [
    { required: true, message: '请输入故障描述', trigger: 'blur' },
    { min: 5, message: '故障描述至少5个字', trigger: 'blur' }
  ],
  urgency_level: [
    { required: true, message: '请选择紧急程度', trigger: 'change' }
  ],
  reporter_name: [
    { required: true, message: '请输入报修人姓名', trigger: 'blur' }
  ],
  reporter_contact: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/, message: '请输入正确的电话号码', trigger: 'blur' }
  ]
}

onMounted(async () => {
  const code = route.query.code
  if (!code) {
    notFound.value = true
    loading.value = false
    return
  }

  queryCode.value = code

  try {
    const data = await assetApiPublic.getByCode(code)
    asset.value = data
  } catch (e) {
    if (e.response?.status === 404) {
      notFound.value = true
    } else {
      ElMessage.error('查询设备信息失败')
    }
  } finally {
    loading.value = false
  }
})

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const payload = {
      asset_id: asset.value.id,
      fault_description: form.fault_description,
      urgency_level: form.urgency_level,
      reporter_name: form.reporter_name,
      reporter_contact: form.reporter_contact
    }
    const res = await repairApi.create(payload)
    submittedId.value = res.id || res.repair_id || '已提交'
    submitted.value = true
  } catch (e) {
    ElMessage.error(e.response?.data?.detail || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  submitted.value = false
  Object.assign(form, {
    fault_description: '',
    urgency_level: 'normal',
    reporter_name: '',
    reporter_contact: ''
  })
}
</script>

<style scoped>
.scan-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 20px;
}

.scan-container {
  max-width: 520px;
  margin: 0 auto;
}

.scan-header {
  text-align: center;
  padding: 30px 0 20px;
  color: #fff;
}

.scan-header h1 {
  font-size: 24px;
  margin: 0 0 8px;
  color: #fff;
}

.scan-subtitle {
  font-size: 14px;
  color: #aab4c8;
  margin: 0;
}

.status-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  margin-top: 16px;
}

.status-card.loading {
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 16px;
}

.status-card.error h2 {
  color: #e6a23c;
  margin: 12px 0 8px;
}

.status-card.error p {
  color: #666;
  margin: 4px 0;
}

.tips {
  color: #999 !important;
  font-size: 13px;
  margin-top: 16px !important;
}

.status-icon {
  font-size: 48px;
}

.content-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  margin-top: 16px;
}

.asset-info {
  background: #f8f9fc;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.asset-title,
.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
  display: inline-block;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  gap: 12px;
  font-size: 14px;
}

.info-row .label {
  color: #909399;
  min-width: 80px;
  flex-shrink: 0;
}

.info-row .value {
  color: #303133;
  font-weight: 500;
}

.info-row .value.code {
  color: #409eff;
  font-family: 'Courier New', monospace;
  font-size: 15px;
}

.repair-form {
  padding: 20px;
}

.success-panel {
  padding: 40px 20px;
  text-align: center;
}

.success-icon {
  font-size: 56px;
  margin-bottom: 12px;
}

.success-panel h2 {
  color: #67c23a;
  margin: 0 0 12px;
}

.success-panel p {
  color: #666;
  margin: 6px 0;
}
</style>
