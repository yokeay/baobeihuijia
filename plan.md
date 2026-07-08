# baobeihuijia v2.0 执行计划

## 已完成
- [x] 数据库迁移：users/follows/case_views/questions 表，cases+comments 字段扩展 ✅
- [x] /api/auth/phone（手机号登录/注册）✅
- [x] /api/users/me（GET + PATCH）✅
- [x] /api/cases/[id]/follow（关注toggle）✅
- [x] /api/cases/[id]/view（浏览量）✅
- [x] /api/cases/[id]/questions（疑问列表+提交）✅
- [x] /api/stats（平台统计）✅
- [x] src/lib/user-auth.ts（JWT工具+随机用户名）✅
- [x] src/lib/UserContext.tsx（用户全局状态Context）✅
- [x] src/components/auth/ 目录已创建 ✅

## 待完成
- [ ] src/components/auth/PhoneAuthSheet.tsx（手机号登录弹窗）
- [ ] src/components/auth/ContactInfoSheet.tsx（关注后联系方式补充弹窗）
- [ ] layout.tsx 注入 UserProvider + PhoneAuthSheet
- [ ] 改版 CaseCard 组件（macOS质感+人文时间+浏览量/关注数）
- [ ] 改版案件详情页（关注按钮/浏览量/数据来源/线索/疑问/评论）
- [ ] globals.css 设计token更新（色彩/圆角/阴影/动效）
- [ ] Header组件升级（毛玻璃+宋体Logo+橙点呼吸动效）
- [ ] git commit + push + 重启服务

## 关键信息
- 远程主机：root@88.198.122.34
- 项目路径：/root/baobeihuijia
- DB：PGPASSWORD=baobeihuijia2025 psql -U baobei -d baobeihuijia -h localhost
- SSH key：~/.ssh/bendy
- 服务重启：cd /root/baobeihuijia && pm2 restart all 或 kill Next.js pid 后 npm run start
