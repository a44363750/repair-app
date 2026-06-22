<template>
  <div class="asset-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>资产列表</span>
          <div>
            <el-button type="primary" @click="$router.push('/assets/add')">
              <el-icon><Plus /></el-icon> 新增资产
            </el-button>
            <el-button @click="$router.push('/assets/import')">
              <el-icon><Upload /></el-icon> 批量导入
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索 -->
      <el-form inline>
        <el-form-item label="关键词">
          <el-input v-model="search.keyword" placeholder="资产编码/名称/位置" clearable @change="loadData" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="search.status" placeholder="请选择" clearable @change="loadData">
            <el-option label="正常" value="normal" />
            <el-option label="维修中" value="maintenance" />
            <el-option label="报废" value="scrap" />
            <el-option label="丢失" value="missing" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 表格 -->
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="asset_code" label="资产编码" width="120" />
        <el-table-column prop="name" label="资产名称" />
        <el-table-column prop="model" label="型号" />
        <el-table-column prop="location" label="存放位置" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="二维码" width="80">
          <template #default="{ row }">
            <el-button link type="primary" @click="showQrCode(row)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editAsset(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteAsset(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="loadData"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
    
    <!-- 二维码对话框 -->
    <el-dialog v-model="qrDialogVisible" title="设备二维码" width="300px">
      <div style="text-align: center">
        <img :src="qrCodeUrl" style="width: 200px; height: 200px" />
        <p style="margin-top: 10px">{{ currentAsset?.asset_code }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { assetApi } from '../../api'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const search = reactive({ keyword: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const qrDialogVisible = ref(false)
const qrCodeUrl = ref('')
const currentAsset = ref(null)

const getStatusType = (status) => {
  const map = { normal: 'success', maintenance: 'warning', scrap: 'info', missing: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { normal: '正常', maintenance: '维修中', scrap: '报废', missing: '丢失' }
  return map[status] || status
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await assetApi.list({
      page: pagination.page,
      page_size: pagination.pageSize,
      ...search
    })
    tableData.value = res.items
    pagination.total = res.total
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const showQrCode = async (row) => {
  currentAsset.value = row
  try {
    const res = await assetApi.getQrCode(row.id)
    qrCodeUrl.value = res.qr_code
    qrDialogVisible.value = true
  } catch (e) {
    ElMessage.error('获取二维码失败')
  }
}

const editAsset = (row) => {
  router.push(`/assets/edit/${row.id}`)
}

const deleteAsset = (row) => {
  ElMessageBox.confirm('确定删除该资产吗？', '提示', { type: 'warning' })
    .then(async () => {
      try {
        await assetApi.delete(row.id)
        ElMessage.success('删除成功')
        loadData()
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>