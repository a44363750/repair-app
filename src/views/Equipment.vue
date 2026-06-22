<template>
  <div>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索资产编号/名称" style="width:200px;margin-right:8px" clearable />
      <el-button type="primary" @click="fetchData">查询</el-button>
    </div>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="asset_code" label="资产编号" width="140" />
      <el-table-column prop="asset_name" label="资产名称" />
      <el-table-column prop="category_name" label="分类" width="100" />
      <el-table-column prop="specification" label="规格型号" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="存放地点" />
      <el-table-column prop="use_person" label="使用人" width="90" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleRepair(row)">报修</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" style="margin-top:16px" @current-change="fetchData" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { assetApi } from '../api'
const router = useRouter()
const tableData = ref([])
const loading = ref(false)
const page = ref(1), pageSize = ref(20), total = ref(0)
const keyword = ref('')
const statusType = (s) => ({ normal: 'success', fault: 'danger', repair: 'warning', scrapped: 'info' }[s] || '')
const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    const res = await assetApi.list( { params })
    tableData.value = res.data.data || res.data
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
const handleRepair = (row) => router.push({ path: '/report', query: { code: row.asset_code } })
onMounted(fetchData)
</script>
