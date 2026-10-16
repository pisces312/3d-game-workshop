// 本仓库自己的 vitest 配置：避免沿用上层目录只匹配 tests/** 的配置
export default {
  test: {
    environment: 'node',
    include: ['*.test.js'],
  },
};
