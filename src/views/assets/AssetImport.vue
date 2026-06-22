<template>
  <el-card>
    <template #header>
      <div class="header-row">
        <span>资产批量导入</span>
        <el-button type="success" size="small" @click="downloadTemplate">
          📥 下载导入模板
        </el-button>
      </div>
    </template>

    <div class="template-info">
      <p>✅ <strong>必填字段：</strong>资产编码、资产名称</p>
      <p>📋 <strong>可选字段：</strong>型号、制造商、购买日期(yyyy-mm-dd)、购买价格、存放地点</p>
      <p>🔗 <strong>关联字段：</strong>分类名称、部门名称、负责人姓名（系统将自动匹配）</p>
      <p>🏷️ <strong>状态：</strong>normal（正常）/ maintenance（维修）/ scrap（报废）/ missing（丢失）</p>
      <p class="tips">💡 模板中包含"分类参考"、"部门参考"、"员工参考"三个Sheet，可查看系统已有数据</p>
    </div>

    <el-divider />

    <el-upload
      ref="uploadRef"
      :auto-upload="false"
      :limit="1"
      accept=".xlsx,.xls"
      :on-change="handleChange"
    >
      <el-button type="primary">📁 选择Excel文件</el-button>
      <template #tip>
        <div class="upload-tip">支持 .xlsx 和 .xls 格式，请先下载模板填写后再上传</div>
      </template>
    </el-upload>

    <div v-if="file" class="file-info">
      <el-icon><Document /></el-icon>
      <span>{{ file.name }}</span>
      <el-button type="danger" size="small" text @click="uploadRef?.clearFiles()">移除</el-button>
    </div>

    <div style="margin-top: 20px">
      <el-button
        type="success"
        :loading="uploading"
        :disabled="!file"
        @click="handleUpload"
      >
        开始导入
      </el-button>
      <el-button @click="$router.back()">取消</el-button>
    </div>

    <!-- 导入结果 -->
    <el-dialog v-model="showResult" title="导入结果" width="500px">
      <el-alert v-if="result" :type="result.imported_count > 0 ? 'success' : 'warning'" show-icon>
        <template #title>
          {{ result.message }}
        </template>
      </el-alert>

      <div v-if="result?.errors?.length > 0" style="margin-top: 16px;">
        <p style="color: #f56c6c; font-weight: 600; margin-bottom: 8px;">
          ⚠️ 跳过 {{ result.errors.length }} 条：
        </p>
        <div class="error-list">
          <div v-for="(err, i) in result.errors" :key="i" class="error-item">
            {{ err }}
          </div>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="handleResultConfirm">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { assetApi } from '../../api'

const router = useRouter()
const uploadRef = ref()
const uploading = ref(false)
const file = ref(null)
const showResult = ref(false)
const result = ref(null)

const downloadTemplate = () => {
  assetApi.downloadTemplate()
}

const handleChange = (uploadFile) => {
  file.value = uploadFile.raw
}

const handleUpload = async () => {
  if (!file.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file.value)
    const res = await assetApi.import(formData)
    result.value = res
    showResult.value = true
  } catch (e) {
    ElMessage.error(e.response?.data?.detail || '导入失败')
  } finally {
    uploading.value = false
  }
}

const handleResultConfirm = () => {
  showResult.value = false
  if (result.value?.imported_count > 0) {
    router.push('/assets')
  }
}
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-info {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}

.template-info p {
  margin: 0 0 4px;
}

.tips {
  color: #909399;
  font-style: italic;
  margin-top: 8px !important;
}

.upload-tip {
  margin-top: 8px;
  color: #999;
  font-size: 12px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
}

.error-list {
  max-height: 200px;
  overflow-y: auto;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  padding: 8px 12px;
}

.error-item {
  font-size: 12px;
  color: #f56c6c;
  padding: 2px 0;
  font-family: monospace;
}
</style>
