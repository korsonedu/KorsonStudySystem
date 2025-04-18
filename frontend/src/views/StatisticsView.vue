<script>
import axios from 'axios';

export default {
  data() {
    return {
      statistics: null, // 存储从后端获取的数据
    };
  },
  async created() {
    try {
      // 调用后端 API 获取统计数据
      const response = await axios.get('/statistics'); // 确保路径正确
      this.statistics = response.data;
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  },
};
</script>